import { pageMetadata, weddingMetadata } from "@/lib/seo";
import { findWedding } from "@/lib/wedding-server";
import { resolveModules } from "@/config/modules";
import { RSVPSection } from "@/components/wedding/RSVPSection";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = pageMetadata({
    title: "Confirmar presença | Forever",
    path: "/" + encodeURIComponent(slug) + "/rsvp",
    index: false,
  });
  try {
    const wedding = await findWedding(slug);
    if (wedding?.status === "published" && resolveModules(wedding.modules, wedding.plan).rsvp)
      return { ...weddingMetadata(wedding, "rsvp"), referrer: "no-referrer" as const };
  } catch {
    return { ...fallback, referrer: "no-referrer" as const };
  }
  return { ...fallback, referrer: "no-referrer" as const };
}
import { PublicWedding } from "@/components/wedding/PublicWedding";
export const dynamic = "force-dynamic";
export default async function RSVPPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <PublicWedding slug={slug} requiredModule="rsvp">
      <main>
        <RSVPSection />
      </main>
    </PublicWedding>
  );
}
