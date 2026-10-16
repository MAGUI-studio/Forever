import { WeddingProvider } from "@/components/wedding/WeddingProvider";
import { validWeddingSlug } from "@/config/forever";
import { notFound } from "next/navigation";
export default async function WeddingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!validWeddingSlug(slug)) notFound();
  return (
    <WeddingProvider key={slug} slug={slug}>
      {children}
    </WeddingProvider>
  );
}
