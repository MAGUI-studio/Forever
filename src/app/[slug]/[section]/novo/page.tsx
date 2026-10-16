import { notFound } from "next/navigation";
import { AdminPanel } from "@/app/admin/ClientAdminViews";
export const metadata = { title: "Novo convite | Forever", robots: { index: false, follow: false } };
export default async function NewInvitationPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section !== "convidados") notFound();
  return <AdminPanel view="dashboard" section="guests" invitationEditor="new" />;
}
