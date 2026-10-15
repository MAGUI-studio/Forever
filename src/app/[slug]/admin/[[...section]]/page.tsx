import { redirect } from "next/navigation";

const ADMIN_TO_PT: Record<string, string> = {
  dashboard: "painel",
  guests: "convidados",
  "check-in": "recepcao",
  tables: "mesas",
  buffet: "buffet",
  history: "historico",
  team: "equipe",
  site: "editar-site",
  "site-settings": "editar-site",
  preview: "previa",
  "editor-preview": "previa-editor",
};

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
  if (name === "login") redirect("/login");
  const target = ADMIN_TO_PT[name] ?? name;
  redirect(`/${slug}/${target}`);
}
