import { handlePaymentSuccess } from "@/lib/stripe-fulfillment";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { services } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    if (!webhookSecret || !signature)
      return NextResponse.json({ error: "Assinatura do webhook ausente." }, { status: 400 });
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Assinatura inválida";
    console.error(`[Stripe Webhook Signature Error]: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.payment_status === "unpaid") {
          console.log(`[Stripe Webhook] Sessão ${session.id} aguardando pagamento assíncrono.`);
          break;
        }

        await handlePaymentSuccess(session);
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.warn(`[Stripe Webhook] Pagamento assíncrono falhou para a sessão ${session.id}.`);
        await handlePaymentFailure(session);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro no processamento";
    console.error("[Stripe Webhook Processing Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handlePaymentFailure(session: Stripe.Checkout.Session) {
  const { db } = services();
  const now = new Date().toISOString();

  const ref = db.doc(`orders/${session.id}`);
  await db.runTransaction(async (transaction) => {
    if ((await transaction.get(ref)).data()?.fulfilledAt) return;
    transaction.set(
      ref,
      {
        sessionId: session.id,
        paymentStatus: "failed",
        failedAt: now,
      },
      { merge: true },
    );
  });
}
