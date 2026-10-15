import { notFound } from "next/navigation";
import { AdminPanel } from "@/app/admin/panel";
export const metadata = { title: "Editar convite | Forever", robots: { index: false, follow: false } };
export default async function EditInvitationPage({ params }: { params: Promise<{ section: string; invitationId: string }> }) {
  const { section, invitationId } = await params;
  if (section !== "convidados" || !/^[a-f0-9]{64}$/.test(invitationId)) notFound();
  return <AdminPanel view="dashboard" section="guests" invitationEditor={{ id: invitationId }} />;
}
