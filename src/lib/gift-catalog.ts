import type { GiftItem } from "@/types/wedding";

export type GiftSort = "default" | "price-asc" | "price-desc";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export function giftSearchIndex(gifts: GiftItem[]) {
  return gifts.map((gift) => ({
    gift,
    fields: [gift.title, gift.description ?? "", gift.categoryLabel ?? ""].map(normalize),
  }));
}

export function searchGifts(
  gifts: GiftItem[],
  index: ReturnType<typeof giftSearchIndex>,
  query: string,
  sort: GiftSort,
) {
  const normalized = normalize(query.trim());
  let list = normalized
    ? index
        .filter((entry) => entry.fields.some((field) => field.includes(normalized)))
        .map((entry) => entry.gift)
    : gifts;
  if (sort === "price-asc") list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  else if (sort === "price-desc") list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  return list;
}

export function savedGiftIndex(gifts: GiftItem[] | undefined) {
  const index = new Map<string, GiftItem>();
  for (const gift of gifts ?? []) if (!index.has(gift.id)) index.set(gift.id, gift);
  return index;
}
