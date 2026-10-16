import { pageMetadata } from "@/lib/seo";
import { redirect } from "next/navigation";
import { AdminPanel, WeddingPreview, SitePreviewFrame } from "@/app/admin/ClientAdminViews";
import { notFound } from "next/navigation";

const REDIRECT_MAP: Record<string, string> = {
  dashboard: "painel",
  guests: "convidados",
  "check-in": "recepcao",
  portaria: "recepcao",
  tables: "mesas",
  history: "historico",
  team: "equipe",
  preview: "previa",
  "editor-preview": "previa-editor",
  "site-settings": "editar-site",
  site: "editar-site",
};

const TITLES: Record<string, string> = {
  painel: "Painel do casamento",
  convidados: "Lista de convidados",
  recepcao: "Controle de chegada",
  mesas: "Mesas e lugares",
  buffet: "Alimentação e buffet",
  historico: "Histórico de alterações",
  equipe: "Equipe da recepção",
  "editar-site": "Editar site",
  previa: "Prévia do site",
  "previa-editor": "Prévia do editor",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; section: string }>;
}) {
  const { slug, section } = await params;
  const canonicalSection = REDIRECT_MAP[section] ?? section;
  const title = (TITLES[canonicalSection] ?? "Painel do casamento") + " | Forever";
  return pageMetadata({
    title,
    description: "Área reservada do casamento no Forever.",
    path: "/" + encodeURIComponent(slug) + "/" + encodeURIComponent(canonicalSection),
    index: false,
  });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; section: string }>;
  searchParams: Promise<{ action?: string | string[]; invitation?: string | string[] }>;
}) {
  const { slug, section: name } = await params;

  if (REDIRECT_MAP[name]) {
    redirect(`/${slug}/${REDIRECT_MAP[name]}`);
  }

  if (name === "convidados") {
    const query = await searchParams;
    if (query.action === "new-invitation") redirect(`/${slug}/convidados/novo`);
    if (query.action === "edit-invitation" && typeof query.invitation === "string" && /^[a-f0-9]{64}$/.test(query.invitation)) {
      redirect(`/${slug}/convidados/${query.invitation}/editar`);
    }
  }

  if (name === "login") redirect("/login");
  if (name === "previa") return <WeddingPreview />;
  if (name === "previa-editor") return <SitePreviewFrame />;
  if (name === "painel") return <AdminPanel view="dashboard" section="overview" />;
  if (name === "convidados") return <AdminPanel view="dashboard" section="guests" />;
  if (name === "recepcao") return <AdminPanel view="dashboard" section="check-in" />;
  if (name === "mesas") return <AdminPanel view="dashboard" section="tables" />;
  if (name === "buffet") return <AdminPanel view="dashboard" section="buffet" />;
  if (name === "historico") return <AdminPanel view="dashboard" section="history" />;
  if (name === "equipe") return <AdminPanel view="dashboard" section="team" />;
  if (name === "editar-site") return <AdminPanel view="dashboard" section="site" />;

  notFound();
}
