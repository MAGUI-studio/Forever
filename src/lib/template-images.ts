import type { WeddingConfig } from "@/types/wedding";
import { MAX_GALLERY_PHOTOS, isUploadThingUrl } from "@/config/gallery";
import { romanceAssets } from "@/config/templates/romance-assets";
import type { TemplateId } from "@/config/templates/registry";

export const templateImageDefaults: Record<TemplateId, Record<string, string>> = {
  "botanical-classic": {
    hero: "/casal/festa-de-casamento.png",
    venue: "/detalhes/mesa.jpg",
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

/**
 * Returns whether a given image URL represents a user-uploaded / custom asset
 * (e.g. UploadThing URL or external HTTPS image) rather than a built-in template graphic.
 */
export function isCustomImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (isUploadThingUrl(trimmed)) return true;
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) return true;
  return !defaultAssetUrls.has(trimmed);
}

/**
 * Retrieves the custom image URL configured for a specific template slot, or empty string
 * if the user has not uploaded/customized this slot (meaning the template default should display).
 */
export function getCustomImageUrl(
  config: WeddingConfig | undefined,
  templateId: TemplateId,
  key: string
): string {
  if (!config) return "";

  // 1. Check customImages dictionary
  const namespacedKey = `${templateId}.${key}`;
  if (config.customImages?.[namespacedKey] && isCustomImageUrl(config.customImages[namespacedKey])) {
    return config.customImages[namespacedKey];
  }
  if (config.customImages?.[key] && isCustomImageUrl(config.customImages[key])) {
    return config.customImages[key];
  }

  // 2. Fallbacks for existing standard fields, but ONLY if they are real custom uploads (not default template paths)
  if (key === "hero") {
    if (isCustomImageUrl(config.couple?.coverImage)) {
      return config.couple.coverImage;
    }
  }

  if (key === "story" && templateId === "contemporary-romance") {
    if (isCustomImageUrl(config.couple?.story?.image)) {
      return config.couple.story!.image!;
    }
  }

  if (key === "venue") {
    if (isCustomImageUrl(config.ceremony?.image)) {
      return config.ceremony.image!;
    }
  }

  return "";
}

/**
 * Resolves the final image URL to render for a given template and section:
 * uses the user's custom photo if available, otherwise falls back to the template's default asset.
 */
export function resolveTemplateImage(
  config: WeddingConfig | undefined,
  templateId: TemplateId,
  key: string
): string {
  const custom = getCustomImageUrl(config, templateId, key);
  if (custom) return custom;
  return templateImageDefaults[templateId]?.[key] ?? "";
}

/** Preserves customized template photos, falling back to previous assets if omitted. */
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
