import {resolveModules,type WeddingModule} from "@/config/modules";
import { findWedding } from "@/lib/wedding-server";
import { notFound } from "next/navigation";
import { WeddingProvider } from "./WeddingProvider";
import { PageCurtainLoader } from "./PageCurtainLoader";
export async function PublicWedding({
  slug,
  children,requiredModule,
}: {
  slug: string;
  children: React.ReactNode;requiredModule?:WeddingModule;
}) {
  const wedding = await findWedding(slug);
  if (!wedding || wedding.status !== "published") notFound();
  if(requiredModule&&!resolveModules(wedding.modules)[requiredModule])notFound();
  return (
    <WeddingProvider slug={slug} config={wedding.config} theme={wedding.theme} modules={wedding.modules} templateId={wedding.templateId}>
      <PageCurtainLoader />
      {children}
    </WeddingProvider>
  );
}
