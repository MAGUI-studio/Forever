import type { Metadata } from "next";
import type { WeddingDocument } from "@/types/forever";

export const SEO_ORIGIN = "https://forever.magui.studio";
export const SEO_IMAGE = {
  url: `${SEO_ORIGIN}/SEO/og-image.png?v=2`,
  width: 1200,
  height: 630,
  alt: "Forever — sites de casamento por MAGUI.studio",
  type: "image/png",
};
export const SEO_DESCRIPTION =
  "Um endereço para celebrar sua história. Crie seu site de casamento, organize os convidados e compartilhe sua lista de presentes com o Forever.";

export function pageMetadata({
  title,
  description = SEO_DESCRIPTION,
  path = "/",
  index = true,
}: {
  title: string;
  description?: string;
  path?: string;
  index?: boolean;
}): Metadata {
  const canonical = new URL(path, SEO_ORIGIN);
  if (canonical.origin !== SEO_ORIGIN) throw new Error("Invalid canonical origin");
  canonical.search = "";
  canonical.hash = "";
  const url = canonical.href;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "pt_BR",
      siteName: "Forever",
      url,
      title,
      description,
      images: [SEO_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: SEO_IMAGE.url, alt: SEO_IMAGE.alt }],
    },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false, noimageindex: true },
        },
  };
}

export const rootMetadata: Metadata = {
  ...pageMetadata({ title: "Forever | MAGUI.studio" }),
  metadataBase: new URL(SEO_ORIGIN),

  alternates: undefined,
  applicationName: "Forever",
  creator: "MAGUI.studio",
  publisher: "MAGUI.studio",
  authors: [{ name: "MAGUI.studio", url: "https://magui.studio" }],
  formatDetection: { telephone: false },
};

export function weddingMetadata(
  wedding: WeddingDocument,
  section: "site" | "rsvp" = "site",
): Metadata {
  const couple = wedding.config.couple;
  const names = `${couple.partner1} & ${couple.partner2}`;
  const date = new Date(couple.weddingDate);
  const dateLabel = Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      }).format(date);
  const details = [dateLabel, couple.locationSummary].filter(Boolean).join(" · ");
  return pageMetadata({
    title: section === "rsvp" ? `Confirme sua presença — ${names} | Forever` : `${names} | Forever`,
    description:
      section === "rsvp"
        ? `Confirme sua presença no casamento de ${names}. Use o convite enviado pelos noivos.`
        : `Celebre o casamento de ${names}${details ? " — " + details : ""}. Confira os detalhes do grande dia no site dos noivos.`,
    path: `/${wedding.slug}${section === "rsvp" ? "/rsvp" : ""}`,
    index: section === "site" && wedding.status === "published",
  });
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
