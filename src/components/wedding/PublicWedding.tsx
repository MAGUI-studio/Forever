import { findWedding } from "@/lib/wedding-server";
import { notFound } from "next/navigation";
import { WeddingProvider } from "./WeddingProvider";
import { PageCurtainLoader } from "./PageCurtainLoader";
export async function PublicWedding({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const wedding = await findWedding(slug);
  if (!wedding || wedding.status !== "published") notFound();
  return (
    <WeddingProvider slug={slug} config={wedding.config} theme={wedding.theme}>
      <PageCurtainLoader />
      {children}
    </WeddingProvider>
  );
}
