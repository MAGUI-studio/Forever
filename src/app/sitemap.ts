import { isPlanExpired } from "@/config/plan-access";
import type { MetadataRoute } from "next";
import { services } from "@/lib/firebase/admin";
import { validWeddingSlug } from "@/config/forever";
import { SEO_ORIGIN } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: `${SEO_ORIGIN}/`, changeFrequency: "weekly", priority: 1 },
  ];
  const weddings = await services()
    .db.collection("weddings")
    .where("status", "==", "published")
    .select("updatedAt", "plan", "config.couple.weddingDate")
    .get();
  for (const document of weddings.docs) {
    if (
      !validWeddingSlug(document.id) ||
      document.data().plan === null ||
      isPlanExpired(document.data())
    )
      continue;
    const updatedAt = document.data().updatedAt;
    const date = typeof updatedAt === "string" ? new Date(updatedAt) : null;
    entries.push({
      url: `${SEO_ORIGIN}/${document.id}`,
      ...(date && !Number.isNaN(date.getTime()) ? { lastModified: date } : {}),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }
  return entries;
}
