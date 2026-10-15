import { redirect } from "next/navigation";

export async function generateMetadata() {
  return {
    robots: { index: false, follow: false },
  };
}

export default async function LegacyAdminPage({
  params,
}: {
  params: Promise<{ slug: string; section?: string[] }>;
}) {
  const { slug, section } = await params;
  const name = section?.[0] ?? "dashboard";
  if (name === "site-settings") redirect(`/${slug}/site`);
  if (name === "login") redirect("/login");
  redirect(`/${slug}/${name}`);
}
