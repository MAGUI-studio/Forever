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
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // In development environments without a webhook secret configured yet,
      // parse event body for test simulation with a security note.
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Webhook secret não configurado em produção." },
          { status: 400 },
        );
      }
      event = JSON.parse(rawBody) as Stripe.Event;
    }
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

        // Best Practice: Only fulfill when payment_status is not 'unpaid'
        // Delayed notification payment methods (e.g. Boleto/Pix) might arrive with unpaid status first
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
        // Ignore other unhandled events
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro no processamento";
    console.error("[Stripe Webhook Processing Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function handlePaymentSuccess(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const action = metadata.action || "new";
  const plan = metadata.plan || "foreverPro";
  const weddingSlug = metadata.weddingSlug;
  const now = new Date().toISOString();

  const { db } = services();

  // 1. If it's an upgrade for an existing wedding
  if (action === "upgrade" && weddingSlug) {
    const weddingRef = db.doc(`weddings/${weddingSlug}`);
    const weddingSnap = await weddingRef.get();

    if (weddingSnap.exists) {
      await weddingRef.update({
        plan: "foreverPro",
        updatedAt: now,
      });

      // Register audit event
      await weddingRef.collection("audit").add({
        action: "plan_upgraded",
        from: "essencial",
        to: "foreverPro",
        stripeSessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        createdAt: now,
      });

      console.log(`[Stripe Webhook] Casamento ${weddingSlug} atualizado com sucesso para Forever PRO.`);
    } else {
      console.warn(`[Stripe Webhook] Casamento ${weddingSlug} não encontrado para upgrade.`);
    }
  }

  // 2. Persist order record in orders collection
  await db.doc(`orders/${session.id}`).set(
    {
      sessionId: session.id,
      plan,
      action,
      weddingSlug: weddingSlug || null,
      amountTotal: session.amount_total,
      currency: session.currency,
      customerEmail: session.customer_details?.email || metadata.customerEmail || null,
      customerName: session.customer_details?.name || null,
      paymentStatus: session.payment_status,
      createdAt: now,
      updatedAt: now,
    },
    { merge: true },
  );
}

async function handlePaymentFailure(session: Stripe.Checkout.Session) {
  const { db } = services();
  const now = new Date().toISOString();

  await db.doc(`orders/${session.id}`).set(
    {
      sessionId: session.id,
      paymentStatus: "failed",
      failedAt: now,
    },
    { merge: true },
  );
}
