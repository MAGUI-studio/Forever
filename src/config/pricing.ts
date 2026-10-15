import type { WeddingPlan } from "./forever";

export interface PlanPricing {
  id: WeddingPlan;
  name: string;
  priceInCents: number;
  formattedPrice: string;
  headline: string;
  description: string;
  guestLimit: number;
  envPriceKey?: string;
}

export const PLAN_PRICING: Record<"essencial" | "foreverPro", PlanPricing> = {
  essencial: {
    id: "essencial",
    name: "Forever Essencial",
    priceInCents: 49700,
    formattedPrice: "R$ 497,00",
    headline: "Básico & Completo · Até 50 convidados",
    description:
      "Site completo, confirmação de presença (RSVP), lista de presentes com chave Pix/link próprio e 0% de comissão, e convites em PDF com QR Code.",
    guestLimit: 50,
    envPriceKey: "STRIPE_PRICE_ESSENCIAL",
  },
  foreverPro: {
    id: "foreverPro",
    name: "Forever PRO",
    priceInCents: 99700,
    formattedPrice: "R$ 997,00",
    headline: "Organização & Recepção · Convidados ilimitados",
    description:
      "Tudo do Essencial com convidados ilimitados, gestão de mesas e lugares, check-in ao vivo via celular na portaria, contas para equipe da recepção, templates exclusivos e + 3 meses de acesso pós-evento.",
    guestLimit: Infinity,
    envPriceKey: "STRIPE_PRICE_PRO",
  },
};

export const UPGRADE_PRICING = {
  id: "upgrade-essencial-pro",
  targetPlan: "foreverPro" as WeddingPlan,
  name: "Upgrade para Forever PRO",
  priceInCents: PLAN_PRICING.foreverPro.priceInCents - PLAN_PRICING.essencial.priceInCents,
  formattedPrice: "R$ 500,00",
  headline: "Diferença única de R$ 500",
  description:
    "Upgrade do plano Forever Essencial para Forever PRO: desbloqueio de convidados ilimitados, gestão de mesas, check-in na portaria e templates exclusivos.",
  envPriceKey: "STRIPE_PRICE_UPGRADE",
};
