"use client";

import { ArrowLeft, ArrowUpRight, Users, Loader2 } from "lucide-react";
import { AdminPageHeading } from "./AdminPageHeading";
import { InvitationForm, type InviteDraft } from "./modals";
import type { Invitation } from "@/types/guests";

export function InvitationEditorPage({ invitation, editing, busy, error, onBack, onSave, guestLimit, otherGuestCount, creationBlocked = false, onUpgrade, upgradeLoading = false }: {
  creationBlocked?: boolean;
  onUpgrade: () => void; upgradeLoading?: boolean;
  guestLimit: number; otherGuestCount: number;
  invitation?: Invitation; editing: boolean; busy: boolean; error: string;
  onBack: () => void; onSave: (draft: InviteDraft, original?: Invitation) => void;
}) {
  return <div className="admin-invitation-page w-full min-w-0 space-y-6 pb-16 pt-6 sm:pt-8">
    <button type="button" disabled={busy} onClick={onBack} className="inline-flex min-h-9 items-center gap-2 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50"><ArrowLeft size={16} aria-hidden="true" />Voltar para convidados</button>
    <AdminPageHeading context="Pessoas que amamos" title={editing ? "Editar" : "Novo"} accent="convite" description={editing ? "Atualize o convite e as informações dos convidados." : "Adicione uma pessoa, família ou grupo à sua lista."} />
    {creationBlocked ? <div className="relative isolate overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
      <Users size={190} className="pointer-events-none absolute -bottom-10 -right-8 -z-10 -rotate-12 text-[#722F37] opacity-[0.04]" aria-hidden="true" />
      <p className="text-xs font-medium text-neutral-500">{otherGuestCount} de {guestLimit} convidados · Forever Essencial</p>
      <h2 className="mt-3 text-xl font-semibold text-neutral-900">Sua lista cresceu. O PRO acompanha.</h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-neutral-600">Você atingiu o limite do Essencial. Com o <strong className="font-semibold text-[#722F37]">Forever PRO</strong>, tenha convidados ilimitados e continue criando convites para todas as pessoas que fazem parte da sua história.</p>
      <p className="mt-3 text-xs text-neutral-500">Seus convites e confirmações já cadastrados são preservados.</p>
      {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" disabled={busy || upgradeLoading} onClick={onUpgrade} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#722F37] px-5 text-sm font-medium text-white transition-colors hover:bg-[#5B252C] disabled:opacity-50">{upgradeLoading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}{upgradeLoading ? "Abrindo upgrade…" : "Assinar Forever PRO"}</button>
        <button type="button" disabled={upgradeLoading} onClick={onBack} className="guest-secondary">Voltar para convidados</button>
      </div>
    </div> : editing && !invitation ? <div className="rounded-2xl border border-neutral-200 bg-white p-8"><p role="status" className="text-sm text-neutral-600">Convite não encontrado. Volte para a lista e selecione outro convite.</p></div> : <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs"><InvitationForm key={invitation?.id ?? "new"} initial={invitation} guestLimit={guestLimit} otherGuestCount={otherGuestCount} busy={busy} error={error} onClose={onBack} onSave={onSave} /></div>}
  </div>;
}
