import { requireAccess, failure, HttpError } from "@/lib/guest-server";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getStripe } from "@/lib/stripe";
import { FOREVER_ORIGIN } from "@/config/forever";
import { PLAN_PRICING, UPGRADE_PRICING } from "@/config/pricing";
import { platformIdentity } from "@/lib/platform-server";
import { purchaseWedding } from "@/lib/purchase-account";
import { services } from "@/lib/firebase/admin";
import { isPlanExpired } from "@/config/plan-access";

const checkoutSchema = z.object({
  plan: z.enum(["essencial", "foreverPro"]),
  action: z.enum(["new", "upgrade"]).default("new"),
  weddingSlug: z.string().trim().optional(),
  customerEmail: z.string().trim().email().optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parseResult = checkoutSchema.safeParse(json);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parseResult.error.flatten() },
        { status: 400 },
      );
    }

    const { plan, action, weddingSlug } = parseResult.data;
    let { customerEmail } = parseResult.data;
    const isUpgrade = action === "upgrade";
    let ownerUid = "";
    let purchaseAttempt = "";
    if (isUpgrade) {
      const access = await requireAccess(request);
      if (access.role !== "admin")
        throw new HttpError(403, "Somente o responsável pode fazer o upgrade.");
      if (access.wedding.plan !== "essencial" || plan !== "foreverPro")
        throw new HttpError(
          409,
          "O upgrade está disponível apenas do Essencial para o Forever PRO.",
        );
      if (!weddingSlug || weddingSlug !== access.wedding.slug)
        throw new HttpError(403, "Casamento inválido para este upgrade.");
      customerEmail = access.email.includes("@") ? access.email : undefined;
    } else {
      const { identity } = await platformIdentity(request);
      const wedding = await purchaseWedding(identity.uid, identity.email ?? "");
      if (!wedding || wedding.slug !== weddingSlug)
        throw new HttpError(403, "Prepare seu casamento antes de continuar para pagamento.");
      if (wedding.status === "suspended" || wedding.status === "archived")
        throw new HttpError(403, "Este casamento está suspenso ou arquivado.");
      if (wedding.plan !== null)
        throw new HttpError(
          409,
          "Seu casamento já possui um plano. Acesse o painel para gerenciá-lo.",
        );
      if (isPlanExpired({ ...wedding, plan }))
        throw new HttpError(
          409,
          "A data deste casamento já ultrapassou a validade do plano. Não é possível iniciar uma nova cobrança.",
        );
      if (plan === "essencial") {
        const list = await services().db.collection(`weddings/${wedding.slug}/invitations`).get();
        const count = list.docs
          .filter((doc) => doc.data().active !== false)
          .reduce((sum, doc) => sum + (doc.data().guests?.length ?? 0), 0);
        if (count > 50)
          throw new HttpError(
            409,
            "Seu casamento possui mais de 50 convidados ativos. Escolha o PRO ou ajuste a lista pelo Studio antes de contratar o Essencial.",
          );
      }
      ownerUid = identity.uid;
      customerEmail = identity.email;
      const purchaseRef = services().db.doc(`weddings/${wedding.slug}`);
      const previous = (await purchaseRef.get()).data()?.purchaseAttempt;
      let replaceAttempt = false;
      if (previous?.sessionId) {
        const checkout = await getStripe().checkout.sessions.retrieve(previous.sessionId);
        if (checkout.status === "complete") {
          const order = await services().db.doc(`orders/${checkout.id}`).get();
          if (!order.data()?.fulfilledAt && order.data()?.paymentStatus !== "failed")
            return NextResponse.json({
              url: `${new URL(request.url).origin}/checkout/sucesso?session_id=${encodeURIComponent(checkout.id)}`,
              sessionId: checkout.id,
            });
          replaceAttempt = true;
        }
        if (checkout.status === "expired") replaceAttempt = true;
        else if (checkout.status === "open" && previous.plan !== plan) {
          await getStripe().checkout.sessions.expire(checkout.id);
          replaceAttempt = true;
        }
      }
      purchaseAttempt = await services().db.runTransaction(async (transaction) => {
        const ref = services().db.doc(`weddings/${wedding.slug}`);
        const current = (await transaction.get(ref)).data();
        if (current?.plan !== null)
          throw new HttpError(409, "O plano já foi alterado. Atualize a página.");
        if (current.purchaseAttempt && current.purchaseAttempt.id !== previous?.id)
          throw new HttpError(
            409,
            "Outra contratação está sendo preparada. Atualize a página para continuar.",
          );
        if (
          !replaceAttempt &&
          current.purchaseAttempt?.plan === plan &&
          current.purchaseAttempt?.uid === ownerUid &&
          Date.now() - Date.parse(current.purchaseAttempt.createdAt) < 23 * 60 * 60 * 1000
        )
          return current.purchaseAttempt.id as string;
        if (
          !replaceAttempt &&
          current.purchaseAttempt &&
          Date.now() - Date.parse(current.purchaseAttempt.createdAt) < 60000
        )
          throw new HttpError(409, "Aguarde a preparação do pagamento antes de trocar o plano.");
        const id = crypto.randomUUID();
        transaction.update(ref, {
          purchaseAttempt: { id, uid: ownerUid, plan, createdAt: new Date().toISOString() },
        });
        return id;
      });
    }

    const requestOrigin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/+$/, "") ||
      FOREVER_ORIGIN;
    const origin = requestOrigin.replace(/\/+$/, "");

    const stripe = getStripe();

    const randomSuffix = purchaseAttempt
      ? purchaseAttempt.replaceAll("-", "").slice(0, 8)
      : crypto.randomBytes(4).toString("hex");
    const integrationIdentifier = `forever_checkout_${randomSuffix}`;

    let lineItem;
    if (isUpgrade) {
      const upgradePriceId = process.env.STRIPE_PRICE_UPGRADE;
      if (upgradePriceId) {
        const price = await stripe.prices.retrieve(upgradePriceId);
        if (
          !price.active ||
          price.currency !== "brl" ||
          price.type !== "one_time" ||
          price.unit_amount !== UPGRADE_PRICING.priceInCents
        ) {
          throw new HttpError(
            503,
            "O preço do upgrade precisa ser revisado. Entre em contato com o suporte.",
          );
        }
        lineItem = { price: upgradePriceId, quantity: 1 };
      } else {
        lineItem = {
          price_data: {
            currency: "brl",
            product_data: {
              name: UPGRADE_PRICING.name,
              description: UPGRADE_PRICING.description,
            },
            unit_amount: UPGRADE_PRICING.priceInCents,
          },
          quantity: 1,
        };
      }
    } else {
      const planConfig = PLAN_PRICING[plan];
      const envPriceId = planConfig.envPriceKey ? process.env[planConfig.envPriceKey] : undefined;

      if (envPriceId) {
        lineItem = { price: envPriceId, quantity: 1 };
      } else {
        lineItem = {
          price_data: {
            currency: "brl",
            product_data: {
              name: planConfig.name,
              description: planConfig.description,
            },
            unit_amount: planConfig.priceInCents,
          },
          quantity: 1,
        };
      }
    }

    const successUrl =
      isUpgrade && weddingSlug
        ? `${origin}/${weddingSlug}/painel?upgrade=success&session_id={CHECKOUT_SESSION_ID}`
        : `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      isUpgrade && weddingSlug
        ? `${origin}/${weddingSlug}/painel`
        : `${origin}/contratar?plan=${plan}&cancelled=1`;

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [lineItem],
        integration_identifier: integrationIdentifier,
        metadata: {
          plan,
          action,
          weddingSlug: weddingSlug || "",
          customerEmail: customerEmail || "",
          ownerUid,
          purchaseAttempt,
        },
        customer_email: customerEmail || undefined,
        success_url: successUrl,
        cancel_url: cancelUrl,
        billing_address_collection: "auto",
        allow_promotion_codes: true,
      },
      purchaseAttempt ? { idempotencyKey: `purchase_${purchaseAttempt}` } : undefined,
    );

    if (purchaseAttempt && weddingSlug)
      await services().db.runTransaction(async (transaction) => {
        const ref = services().db.doc(`weddings/${weddingSlug}`);
        const current = (await transaction.get(ref)).data();
        if (current?.purchaseAttempt?.id === purchaseAttempt)
          transaction.update(ref, {
            purchaseAttempt: { ...current.purchaseAttempt, sessionId: session.id },
          });
      });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: unknown) {
    if (err instanceof HttpError) return failure(err);
    const message = err instanceof Error ? err.message : "Erro interno ao criar checkout.";
    console.error("[Stripe Checkout Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
