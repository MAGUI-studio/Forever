import type { WeddingConfig } from "@/types/wedding";

export type WeddingPlan = "essencial" | "foreverPro";
export const defaultWeddingPlan: WeddingPlan = "foreverPro";
export function normalizeWeddingPlan(plan?: string | null): WeddingPlan | null {
  if (plan === null) return null;
  return plan === "essencial" ? "essencial" : "foreverPro";
}
export const PLAN_GUEST_LIMITS: Record<WeddingPlan, number> = {
  essencial: 50,
  foreverPro: Infinity,
};
export const PLAN_NAMES: Record<WeddingPlan, string> = {
  essencial: "Forever Essencial",
  foreverPro: "Forever PRO",
};
export function getWeddingGuestLimit(plan?: WeddingPlan | null): number {
  if (plan === null) return 0;
  if (plan === "essencial") return 50;
  return Infinity;
}

export const FOREVER_ORIGIN = (
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    : "https://forever.magui.studio"
).replace(/\/+$/, "");
export const reservedSlugs = new Set([
  "painel",
  "convidados",
  "recepcao",
  "mesas",
  "buffet",
  "historico",
  "equipe",
  "previa",
  "previa-editor",
  "dashboard",
  "guests",
  "check-in",
  "tables",
  "history",
  "team",
  "site",
  "editar-site",
  "preview",
  "editor-preview",
  "admin",
  "api",
  "studio",
  "rsvp",
  "confirmar",
  "presentes",
  "login",
  "_next",
  "favicon",
  "robots",
  "sitemap",
  "assets",
  "fonts",
]);
export const validWeddingSlug = (slug: string) =>
  /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
  slug.length >= 3 &&
  slug.length <= 80 &&
  !reservedSlugs.has(slug);
export function weddingPath(slug: string, path = "") {
  return "/" + slug + (path ? "/" + path.replace(/^\/+/, "") : "");
}
export const emptyWeddingConfig: WeddingConfig = {
  sections: {gallery:true},
  customImages: {},
  couple: {
    partner1: "Primeira pessoa",
    partner2: "Segunda pessoa",
    weddingDate: "",
    locationSummary: "",
    hashtag: "",
    coverImage: "/casal/festa-de-casamento.png",
    headline: "Vamos celebrar nossa história.",
    story: {
      enabled: false,
      title: "Nossa história",
      text: [],
      image: "/detalhes/aliancas-florais.jpg",
    },
  },
  gallery: [],
  ceremony: {
    title: "Cerimônia",
    subtitle: "Nosso grande dia",
    time: "",
    placeName: "",
    address: "",
    cityState: "",
    googleMapsUrl: "",
    image: "/detalhes/mesa.jpg",
  },
  party: {
    title: "Recepção",
    subtitle: "Vamos celebrar",
    time: "",
    placeName: "",
    address: "",
    cityState: "",
    googleMapsUrl: "",
    image: "/detalhes/mesa.jpg",
  },
  dressCode: {
    title: "Traje da celebração",
    description: "Escolha um traje confortável para celebrar conosco.",
    dos: [],
    donts: [],
    palette: [],
    gallery: [],
  },
  gifts: [],
  pix: {
    key: "",
    keyType: "email",
    receiverName: "",
    city: "",
    whatsappConfirmationPhone: "",
  },
  creditCard: { enabled: false, defaultPaymentLink: "" },
  rsvp: { googleAppsScriptUrl: "", contactWhatsApp: "" },
};
