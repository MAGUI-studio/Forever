"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  ArrowUpRight,
  Calendar,
  Copy,
  Check,
  Heart,
  Pencil,
  Plus,
  Loader2,
  ExternalLink,
} from "lucide-react";
import type { Guest, Invitation, EventTable } from "@/types/guests";
import type { WeddingConfig } from "@/types/wedding";
import type { WeddingPlan } from "@/config/forever";

interface DashboardOverviewProps {
  guests: Guest[];
  invitations: Invitation[];
  tables: EventTable[];
  weddingConfig: WeddingConfig;
  slug: string;
  templateId: string;
  plan: WeddingPlan;
  modules: Record<string, boolean>;
  weddingPath: (sub?: string) => string;
  onOpenNewInvite: () => void;
  onOpenSettings: () => void;
  onUpgrade: () => void;
  upgradeLoading: boolean;
  loading?: boolean;
}

const TEMPLATE_NAMES: Record<string, string> = {
  "contemporary-romance": "Romance Contemporâneo",
  "botanical-classic": "Botânico Clássico",
};

export function DashboardOverview({
  guests,
  invitations,
  tables,
  weddingConfig,
  slug,
  templateId,
  plan,
  modules,
  weddingPath,
  onOpenNewInvite,
  onOpenSettings,
  onUpgrade,
  upgradeLoading,
  loading = false,
}: DashboardOverviewProps) {
  const [copiedLink, setCopiedLink] = useState(false);

  // Real guest statistics
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter((g) => g.status === "confirmado");
  const pendingGuests = guests.filter((g) => g.status === "pendente");
  const declinedGuests = guests.filter((g) => g.status === "recusado");

  const confirmedPct = totalGuests > 0 ? Math.round((confirmedGuests.length / totalGuests) * 100) : 0;
  const pendingPct = totalGuests > 0 ? Math.round((pendingGuests.length / totalGuests) * 100) : 0;
  const declinedPct = totalGuests > 0 ? Math.round((declinedGuests.length / totalGuests) * 100) : 0;

  // Real invitations statistics
  const activeInvitations = invitations.filter((i) => i.active);
  const totalInvites = activeInvitations.length;
  const sentInvites = activeInvitations.filter((i) => !!i.sentAt).length;
  const openedInvites = activeInvitations.filter((i) => !!i.openedAt).length;
  const sentPct = totalInvites > 0 ? Math.round((sentInvites / totalInvites) * 100) : 0;

  // Real dietary restrictions count
  const dietaryCount = guests.filter((g) => {
    return activeInvitations.some(
      (inv) =>
        inv.personalResponses?.[g.id]?.dietaryRestrictions?.trim() ||
        (inv.guests.length === 1 && inv.dietaryRestrictions?.trim())
    );
  }).length;

  // Real guest messages count
  let messagesCount = 0;
  activeInvitations.forEach((inv) => {
    if (inv.personalResponses) {
      Object.values(inv.personalResponses).forEach((r) => {
        if (r.message?.trim()) messagesCount++;
      });
    } else if (inv.message?.trim()) {
      messagesCount++;
    }
  });

  // Date parsing & countdown
  const weddingDateStr = weddingConfig.couple.weddingDate;
  let daysUntilWedding: number | null = null;
  let formattedWeddingDate = "Data a definir";

  if (weddingDateStr) {
    const d = new Date(weddingDateStr);
    if (!isNaN(d.getTime())) {
      formattedWeddingDate = d.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      });
      const today = new Date();
      const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      daysUntilWedding = Math.ceil((targetDay.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  // RSVP deadline
  const rsvpDeadlineStr = weddingConfig.rsvp.deadlineDate;
  let daysUntilRsvp: number | null = null;
  let formattedRsvpDeadline: string | null = null;

  if (rsvpDeadlineStr) {
    const d = new Date(rsvpDeadlineStr);
    if (!isNaN(d.getTime())) {
      formattedRsvpDeadline = d.toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      });
      const today = new Date();
      const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const targetDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      daysUntilRsvp = Math.ceil((targetDay.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  async function handleCopySiteLink() {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}/casamento/${slug}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // ignore
    }
  }

  return (
    <div className="pt-8 sm:pt-12 space-y-8 pb-12">
      {/* 1. HERO SECTION: Title & Story on Left, 4 Clean Stat Cards on Right */}
      <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12">
        {/* Left: Editorial Heading */}
        <div className="space-y-4">
          <p className="admin-eyebrow text-[11px] font-semibold uppercase tracking-wider text-[#80654E]">
            Com carinho, cada detalhe
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-[#161616] leading-[1.1] tracking-tight">
            Quem faz parte da
            <br />
            nossa <em className="italic text-[#722F37]">história.</em>
          </h1>

          <p className="text-xs sm:text-sm text-[#80654E] max-w-lg leading-relaxed">
            Um espaço para cuidar dos convites e de quem estará ao nosso lado.
            {weddingDateStr && formattedWeddingDate !== "Data a definir" && (
              <span className="block mt-1 text-[#161616] font-medium">
                {formattedWeddingDate}
                {daysUntilWedding !== null && daysUntilWedding > 0 && ` · Faltam ${daysUntilWedding} dias`}
              </span>
            )}
          </p>

          {modules.guestList && (
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenNewInvite}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#722F37] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:bg-[#5B252C] hover:shadow-sm cursor-pointer"
              >
                <Plus size={15} />
                <span>Novo convite</span>
              </button>

              <button
                type="button"
                onClick={handleCopySiteLink}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#722F3730] bg-white px-4 py-2.5 text-xs font-medium text-[#722F37] transition-all duration-200 hover:border-[#722F37] hover:bg-[#722F370a] shadow-xs cursor-pointer"
              >
                {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedLink ? "Link copiado!" : "Copiar link do site"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: 4 Clean Stat Cards in Forever Red Palette */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="Resumo de convidados">
          {/* Card 1: Total */}
          <article className="relative flex min-h-36 sm:min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-[#722F3725] bg-[#FFFDFB] p-4 sm:p-5 shadow-xs transition-all hover:border-[#722F3740]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-3 text-[#722F37] opacity-[0.07] rotate-[-12deg]">
              <Users size={90} />
            </span>
            <p className="relative text-xs sm:text-sm font-medium text-[#6B6760]">Convidados ativos</p>
            <strong className="relative my-1 font-serif text-4xl sm:text-5xl font-normal text-[#161616]">
              {loading ? "…" : totalGuests}
            </strong>
            <span className="relative text-[11px] text-[#8C877F]">
              {plan === "essencial" ? `${totalGuests} de 50 vagas ocupadas` : `${totalInvites} convites cadastrados`}
            </span>
          </article>

          {/* Card 2: Confirmados (Forever Red Highlight) */}
          <article className="relative flex min-h-36 sm:min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-[#722F3735] bg-[#722F370f] p-4 sm:p-5 shadow-xs transition-all hover:border-[#722F37]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-3 text-[#722F37] opacity-10 rotate-[-12deg]">
              <CheckCircle2 size={90} />
            </span>
            <p className="relative text-xs sm:text-sm font-semibold text-[#722F37]">Confirmados</p>
            <strong className="relative my-1 font-serif text-4xl sm:text-5xl font-semibold text-[#722F37]">
              {loading ? "…" : confirmedGuests.length}
            </strong>
            <span className="relative text-[11px] font-medium text-[#722F37]">
              {totalGuests > 0 ? `${confirmedPct}% de presença confirmada` : "Aguardando respostas"}
            </span>
          </article>

          {/* Card 3: Pendentes */}
          <article className="relative flex min-h-36 sm:min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFDFB] p-4 sm:p-5 shadow-xs transition-all hover:border-[#722F3730]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-3 text-[#7A756D] opacity-[0.07] rotate-[-12deg]">
              <Clock size={90} />
            </span>
            <p className="relative text-xs sm:text-sm font-medium text-[#6B6760]">Pendentes</p>
            <strong className="relative my-1 font-serif text-4xl sm:text-5xl font-normal text-[#161616]">
              {loading ? "…" : pendingGuests.length}
            </strong>
            <span className="relative text-[11px] text-[#8C877F]">
              {totalGuests > 0 ? `${pendingPct}% aguardando resposta` : "Nenhuma pendência"}
            </span>
          </article>

          {/* Card 4: Não comparecerão */}
          <article className="relative flex min-h-36 sm:min-h-40 flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFDFB] p-4 sm:p-5 shadow-xs transition-all hover:border-[#722F3730]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-3 text-[#8C877F] opacity-[0.07] rotate-[-12deg]">
              <UserX size={90} />
            </span>
            <p className="relative text-xs sm:text-sm font-medium text-[#6B6760]">Não comparecerão</p>
            <strong className="relative my-1 font-serif text-4xl sm:text-5xl font-normal text-[#6B6760]">
              {loading ? "…" : declinedGuests.length}
            </strong>
            <span className="relative text-[11px] text-[#8C877F]">
              {totalGuests > 0 ? `${declinedPct}% justificaram ausência` : "Nenhum recusado"}
            </span>
          </article>
        </div>
      </section>

      {/* 2. UNIFIED CENTRAL PANEL: Seu Site & Andamento do Casamento (Combined in 1 Elegant Card) */}
      <section className="overflow-hidden rounded-2xl border border-[#722F3725] bg-[#FFFDFB] shadow-xs">
        <div className="grid grid-cols-1 divide-y divide-[#722F3715] lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
          {/* Left Side: Seu Site */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#80654E]">
                Do seu jeito
              </p>
              <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-[#161616]">
                Seu site de casamento
              </h2>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#6B6760]">
                Template: <strong className="text-[#161616]">{TEMPLATE_NAMES[templateId] ?? "Romance Contemporâneo"}</strong>.
                Personalize fotos, textos, ordem das seções e acompanhe cada alteração antes de publicar.
              </p>

              {/* URL Pill */}
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[#16161610] bg-[#FAF7F5] px-3.5 py-2.5 text-xs">
                <span className="font-mono text-xs text-[#161616] truncate font-medium">
                  /casamento/{slug}
                </span>
                <button
                  type="button"
                  onClick={handleCopySiteLink}
                  className="shrink-0 p-1 text-[#722F37] hover:opacity-75 cursor-pointer"
                  title="Copiar link"
                >
                  {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {modules.siteEditor && (
                <Link
                  href={weddingPath("admin/site")}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#722F37] px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#5B252C] shadow-xs"
                >
                  <Pencil size={14} />
                  <span>Personalizar site</span>
                </Link>
              )}

              <Link
                href={weddingPath()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#722F3730] bg-white px-4 py-2.5 text-xs font-medium text-[#722F37] transition-all hover:bg-[#722F370a] shadow-xs"
              >
                <ExternalLink size={14} />
                <span>Ver site</span>
              </Link>
            </div>
          </div>

          {/* Right Side: Andamento do RSVP & Entregas */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-gradient-to-br from-transparent to-[#722F3705]">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#80654E]">
                  Acompanhamento
                </p>
                {formattedRsvpDeadline && (
                  <span className="text-[11px] text-[#8C877F]">
                    Prazo RSVP: {formattedRsvpDeadline}
                    {daysUntilRsvp !== null && daysUntilRsvp >= 0
                      ? ` (${daysUntilRsvp} dias)`
                      : " (encerrado)"}
                  </span>
                )}
              </div>

              <h2 className="mt-2 font-serif text-2xl sm:text-3xl text-[#161616]">
                Confirmações & Entregas
              </h2>

              {/* Progress Bar */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-[#161616]">
                  <span className="text-[#6B6760]">Taxa de resposta</span>
                  <span className="font-semibold text-[#722F37]">
                    {confirmedGuests.length + declinedGuests.length} de {totalGuests} respondidos (
                    {totalGuests > 0
                      ? Math.round(((confirmedGuests.length + declinedGuests.length) / totalGuests) * 100)
                      : 0}
                    %)
                  </span>
                </div>

                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#EFECE6] flex" aria-hidden="true">
                  {confirmedPct > 0 && (
                    <div style={{ width: `${confirmedPct}%` }} className="bg-[#722F37]" />
                  )}
                  {declinedPct > 0 && (
                    <div style={{ width: `${declinedPct}%` }} className="bg-[#C4A4A9]" />
                  )}
                  {pendingPct > 0 && (
                    <div style={{ width: `${pendingPct}%` }} className="bg-[#E2DDD5]" />
                  )}
                </div>
              </div>

              {/* Summary Indicators */}
              <div className="mt-5 space-y-2.5 text-xs text-[#6B6760]">
                <div className="flex items-center justify-between py-1 border-b border-[#16161608]">
                  <span>Envio de convites:</span>
                  <span className="font-medium text-[#161616]">
                    <strong>{sentInvites}</strong> de {totalInvites} enviados ({sentPct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-[#16161608]">
                  <span>Abertura dos links:</span>
                  <span className="font-medium text-[#161616]">
                    <strong>{openedInvites}</strong> convites acessados
                  </span>
                </div>

                {dietaryCount > 0 && (
                  <div className="flex items-center justify-between py-1 border-b border-[#16161608] text-[#722F37]">
                    <span>Restrições alimentares:</span>
                    <Link href={weddingPath("admin/buffet")} className="font-semibold underline">
                      {dietaryCount} {dietaryCount === 1 ? "convidado informou" : "convidados informaram"}
                    </Link>
                  </div>
                )}

                {messagesCount > 0 && (
                  <div className="flex items-center justify-between py-1 border-b border-[#16161608] text-[#722F37]">
                    <span>Recados recebidos:</span>
                    <span className="font-semibold">{messagesCount} votos de carinho</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Link to Guest List */}
            <div className="pt-2">
              <Link
                href={weddingPath("admin/guests")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#722F37] hover:underline"
              >
                <span>Ver lista completa de convidados</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRO UPGRADE BANNER (Only if plan is essencial) */}
      {plan === "essencial" && (
        <section className="relative overflow-hidden rounded-2xl border border-[#722F3730] bg-gradient-to-br from-[#FFFDFB] via-[#FFFDFB] to-[#722F370c] p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#722F3730] bg-[#722F3712] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#722F37]">
                <Heart size={12} className="fill-[#722F37]" />
                Upgrade disponível · Forever PRO
              </div>
              <h3 className="font-serif text-2xl font-normal text-[#161616]">
                Desbloqueie convidados <em className="italic text-[#722F37]">ilimitados</em>
              </h3>
              <p className="text-xs text-[#6B6760] leading-relaxed">
                Seu plano Essencial tem limite de até 50 convidados. Com o PRO, vocês têm convidados sem limites, mesas, check-in na portaria e templates exclusivos.
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-1.5 lg:items-end">
              <button
                type="button"
                disabled={upgradeLoading}
                onClick={onUpgrade}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#722F37] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#5B252C] disabled:opacity-60 cursor-pointer"
              >
                {upgradeLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Iniciando…</span>
                  </>
                ) : (
                  <>
                    <Heart size={13} className="fill-white" />
                    <span>Fazer upgrade para Forever PRO</span>
                    <ArrowUpRight size={13} />
                  </>
                )}
              </button>
              <span className="text-[11px] text-[#8C877F]">Pagamento único · Diferença de R$&nbsp;500</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
