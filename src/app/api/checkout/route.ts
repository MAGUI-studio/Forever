import { requireAccess, failure, HttpError } from "@/lib/guest-server";
import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getStripe } from "@/lib/stripe";
import { FOREVER_ORIGIN } from "@/config/forever";
import { PLAN_PRICING, UPGRADE_PRICING } from "@/config/pricing";

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
    if (isUpgrade) {
      const access = await requireAccess(request);
      if (access.role !== "admin") throw new HttpError(403, "Somente o responsável pode fazer o upgrade.");
      if (access.wedding.plan !== "essencial" || plan !== "foreverPro") throw new HttpError(409, "O upgrade está disponível apenas do Essencial para o Forever PRO.");
      if (!weddingSlug || weddingSlug !== access.wedding.slug) throw new HttpError(403, "Casamento inválido para este upgrade.");
      customerEmail = access.email.includes("@") ? access.email : undefined;
    }

    // Resolve base origin URL
    const requestOrigin =
      request.headers.get("origin") ||
      request.headers.get("referer")?.replace(/\/+$/, "") ||
      FOREVER_ORIGIN;
    const origin = requestOrigin.replace(/\/+$/, "");

    const stripe = getStripe();

    // 8 random characters suffix for tracking as recommended by Stripe best practices
    const randomSuffix = crypto.randomBytes(4).toString("hex");
    const integrationIdentifier = `forever_checkout_${randomSuffix}`;

    // Configure line items based on purchase type (upgrade or new plan)
    let lineItem;
    if (isUpgrade) {
      const upgradePriceId = process.env.STRIPE_PRICE_UPGRADE;
      if (upgradePriceId) {
        const price = await stripe.prices.retrieve(upgradePriceId);
        if (!price.active || price.currency !== "brl" || price.type !== "one_time" || price.unit_amount !== UPGRADE_PRICING.priceInCents) {
          throw new HttpError(503, "O preço do upgrade precisa ser revisado. Entre em contato com o suporte.");
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
      const envPriceId = planConfig.envPriceKey
        ? process.env[planConfig.envPriceKey]
        : undefined;

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

    // Success and cancel URLs
    const successUrl = isUpgrade && weddingSlug
      ? `${origin}/${weddingSlug}/painel?upgrade=success&session_id={CHECKOUT_SESSION_ID}`
      : `${origin}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl = isUpgrade && weddingSlug
      ? `${origin}/${weddingSlug}/painel`
      : `${origin}/#preco`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [lineItem],
      integration_identifier: integrationIdentifier,
      metadata: {
        plan,
        action,
        weddingSlug: weddingSlug || "",
        customerEmail: customerEmail || "",
      },
      customer_email: customerEmail || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      // Dynamic payment methods enabled by intentionally omitting payment_method_types
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err: unknown) {
    if (err instanceof HttpError) return failure(err);
    const message =
      err instanceof Error ? err.message : "Erro interno ao criar checkout.";
    console.error("[Stripe Checkout Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
