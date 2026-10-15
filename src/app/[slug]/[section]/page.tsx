import { pageMetadata } from "@/lib/seo";
import { WeddingPreview } from "@/app/admin/WeddingPreview";
import { redirect } from "next/navigation";
import { AdminPanel } from "@/app/admin/panel";
import { SitePreviewFrame } from "@/app/admin/SitePreviewFrame";
import { notFound } from "next/navigation";

const VALID_SECTIONS = [
  "dashboard",
  "guests",
  "check-in",
  "tables",
  "buffet",
  "history",
  "team",
  "site",
  "preview",
  "editor-preview",
  "site-settings",
  "login",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; section: string }>;
}) {
  const { slug, section } = await params;
  const titles: Record<string, string> = {
    dashboard: "Painel do casamento",
    guests: "Lista de convidados",
    "check-in": "Controle de chegada",
    tables: "Mesas e lugares",
    buffet: "Alimentação e buffet",
    history: "Histórico de alterações",
    team: "Equipe da recepção",
    site: "Editor do site",
    preview: "Prévia do site",
    "editor-preview": "Prévia do editor",
  };
  const name = section ?? "dashboard";
  return pageMetadata({
    title: (titles[name] ?? "Painel administrativo") + " | Forever",
    description: "Área reservada do casamento no Forever.",
    path: "/" + encodeURIComponent(slug) + "/" + encodeURIComponent(name),
    index: false,
  });
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; section: string }>;
}) {
  const { slug, section: name } = await params;
  if (!VALID_SECTIONS.includes(name as (typeof VALID_SECTIONS)[number])) {
    notFound();
  }
  if (name === "preview") return <WeddingPreview />;
  if (name === "editor-preview") return <SitePreviewFrame />;
  if (name === "site-settings") redirect(`/${slug}/site`);
  if (name === "site") return <AdminPanel view="dashboard" section={name} />;
  if (name === "login") redirect("/login");
  if (name === "dashboard") return <AdminPanel view="dashboard" />;
  return (
    <AdminPanel
      view="dashboard"
      section={name as "guests" | "check-in" | "tables" | "buffet" | "history" | "team"}
    />
  );
}
