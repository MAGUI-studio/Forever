import { runtimeEnv } from "@/lib/runtime-env";
import "server-only";
import Stripe from "stripe";

let stripeSingleton: Stripe | null = null;

export function getStripe(): Stripe {
  const apiKey = runtimeEnv("STRIPE_SECRET_KEY");
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY não foi configurada nas variáveis de ambiente.",
    );
  }

  if (!stripeSingleton) {
    stripeSingleton = new Stripe(apiKey, {
      httpClient: Stripe.createFetchHttpClient(),
      apiVersion: "2026-09-30.endive",
      appInfo: {
        name: "Forever Casamentos",
        version: "1.0.0",
        url: "https://forever.magui.studio",
      },
    });
  }

  return stripeSingleton;
}
