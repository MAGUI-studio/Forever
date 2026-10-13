import type { WeddingConfig } from "@/types/wedding";
export const FOREVER_ORIGIN = (
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    : "https://forever.magui.studio"
).replace(/\/+$/, "");
export const reservedSlugs = new Set([
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
  couple: {
    partner1: "Primeira pessoa",
    partner2: "Segunda pessoa",
    weddingDate: "",
    locationSummary: "",
    hashtag: "",
    coverImage: "/detalhes/aliancas-florais.jpg",
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
