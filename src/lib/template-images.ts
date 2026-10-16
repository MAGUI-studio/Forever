import type { WeddingConfig } from "@/types/wedding";
import { MAX_GALLERY_PHOTOS, isUploadThingUrl } from "@/config/gallery";
import { romanceAssets } from "@/config/templates/romance-assets";
import type { TemplateId } from "@/config/templates/registry";

export const templateImageDefaults: Record<TemplateId, Record<string, string>> = {
  "minimalist-modern": {
    hero: "/templates/minimalist-modern/hero.webp",
    story: "/templates/minimalist-modern/story.webp",
    dress: "/templates/minimalist-modern/dress.webp",
    venue: "",
  },
  "serene-breeze": {
    hero: "/detalhes/praia.jpg",
    story: "/casal/festa-de-casamento.png",
    venue: "/detalhes/paisagem.jpg",
  },
  "botanical-classic": {
    hero: "/templates/botanical-classic/hero.webp",
    venue: "/templates/botanical-classic/venue.webp",
  },
  "contemporary-romance": {
    hero: romanceAssets.hero,
    story: romanceAssets.story,
    detail: romanceAssets.detail,
    venue: romanceAssets.venue,
    schedule: romanceAssets.schedule,
    dress: romanceAssets.dress,
    rsvp: romanceAssets.rsvp,
    footer: romanceAssets.footer,
  },
};

export const defaultAssetUrls = new Set([
  ...["hero", "story", "detail", "venue", "schedule"].map(
    (key) => `/templates/contemporary-romance/${key}.webp`,
  ),
  "/casal/aliancas-que-selam-nossa-promessa.png",
  "/casal/cerimonia-religiosa.png",
  ...Object.values(templateImageDefaults).flatMap((slots) => Object.values(slots)),
  "/casal/festa-de-casamento.png",
  "/detalhes/aliancas-florais.jpg",
  "/detalhes/mesa.jpg",
  romanceAssets.hero,
  romanceAssets.story,
  romanceAssets.detail,
  romanceAssets.venue,
  romanceAssets.schedule,
  romanceAssets.dress,
  romanceAssets.rsvp,
  romanceAssets.footer,
]);

export function isCustomImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (isUploadThingUrl(trimmed)) return true;
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) return true;
  return !defaultAssetUrls.has(trimmed);
}

export function getCustomImageUrl(
  config: WeddingConfig | undefined,
  templateId: TemplateId,
  key: string,
): string {
  if (!config) return "";

  if (key === "dress" && config.dressCode?.gallery.length) return config.dressCode.gallery[0].image;

  if (templateId === "minimalist-modern" || templateId === "serene-breeze") {
    const images = config.customImages;

    for (const slot of [`${templateId}.${key}`, key]) {
      if (images && Object.prototype.hasOwnProperty.call(images, slot)) return images[slot];
    }
  }

  const namespacedKey = `${templateId}.${key}`;
  if (
    config.customImages?.[namespacedKey] &&
    isCustomImageUrl(config.customImages[namespacedKey])
  ) {
    return config.customImages[namespacedKey];
  }
  if (config.customImages?.[key] && isCustomImageUrl(config.customImages[key])) {
    return config.customImages[key];
  }

  if (key === "hero") {
    if (isCustomImageUrl(config.couple?.coverImage)) {
      return config.couple.coverImage;
    }
  }

  if (key === "story") {
    if (isCustomImageUrl(config.couple?.story?.image)) {
      return config.couple.story!.image!;
    }
  }

  if (key === "venue") {
    if (isCustomImageUrl(config.ceremony?.image)) {
      return config.ceremony.image!;
    }
  }

  if (key === "dress" && isCustomImageUrl(config.dressCode?.gallery[0]?.image)) {
    return config.dressCode.gallery[0].image;
  }

  return "";
}

export function resolveTemplateImage(
  config: WeddingConfig | undefined,
  templateId: TemplateId,
  key: string,
): string {
  const custom = getCustomImageUrl(config, templateId, key);
  if (custom) return custom;

  if (
    config?.customImages &&
    [`${templateId}.${key}`, key].some(
      (slot) =>
        Object.prototype.hasOwnProperty.call(config.customImages, slot) &&
        config.customImages![slot] === "",
    )
  )
    return "";
  if (key === "dress" && config?.dressCode?.gallery.length) return "";
  if (templateId === "minimalist-modern") return templateImageDefaults[templateId][key] ?? "";
  if (key === "dress" || templateId === "serene-breeze") return "";
  return templateImageDefaults[templateId]?.[key] ?? "";
}

export function preserveTemplateImages<T extends WeddingConfig>(next: T, current: WeddingConfig) {
  return {
    ...next,
    customImages: {
      ...(current.customImages ?? {}),
      ...(next.customImages ?? {}),
    },
    couple: {
      ...next.couple,
      coverImage: next.couple?.coverImage ?? current.couple.coverImage,
      ...(next.couple?.story
        ? {
            story: {
              ...next.couple.story,
              image: next.couple.story.image ?? current.couple.story?.image ?? "",
            },
          }
        : current.couple.story
          ? { story: current.couple.story }
          : {}),
    },
    ceremony: {
      ...next.ceremony,
      image: next.ceremony?.image ?? current.ceremony.image ?? "",
    },
    party: {
      ...next.party,
      image: next.party?.image ?? current.party.image ?? "",
    },
    gallery: (next.gallery ?? current.gallery).slice(0, MAX_GALLERY_PHOTOS),
    dressCode: {
      ...next.dressCode,
      gallery: next.dressCode?.gallery ?? current.dressCode.gallery,
    },
  };
}
