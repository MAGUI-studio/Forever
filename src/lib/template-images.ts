import type { WeddingConfig } from "@/types/wedding";

/** Template artwork is fixed; gift images belong to the couple's catalog. */
export function preserveTemplateImages<T extends WeddingConfig>(next: T, current: WeddingConfig) {
  return {
    ...next,
    couple: {
      ...next.couple,
      coverImage: current.couple.coverImage,
      ...(next.couple.story ? {story: {...next.couple.story, image: current.couple.story?.image ?? ""}} : {}),
    },
    ceremony: {...next.ceremony, image: current.ceremony.image ?? ""},
    party: {...next.party, image: current.party.image ?? ""},
    gallery: current.gallery,
    dressCode: {...next.dressCode, gallery: current.dressCode.gallery},
  };
}
