"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  ArrowUpRight,
  Copy,
  Check,
  Heart,
  Pencil,
  Plus,
  Loader2,
  ExternalLink,
  MessageSquareHeart,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  // Real guest messages extracted from personal responses or invitation level
  const guestMessages: { name: string; message: string }[] = [];
  activeInvitations.forEach((inv) => {
    if (inv.personalResponses) {
      Object.entries(inv.personalResponses).forEach(([guestId, resp]) => {
        if (resp.message?.trim()) {
          const g = inv.guests.find((guest) => guest.id === guestId);
          guestMessages.push({
            name: g ? g.name : inv.label,
            message: resp.message.trim(),
          });
        }
      });
    }
    if (inv.message?.trim()) {
      const alreadyAdded = guestMessages.some((m) => m.message === inv.message.trim());
      if (!alreadyAdded) {
        guestMessages.push({
          name: inv.label,
          message: inv.message.trim(),
        });
      }
    }
  });

  // Real dietary restrictions count
  const dietaryCount = guests.filter((g) => {
    return activeInvitations.some(
      (inv) =>
        inv.personalResponses?.[g.id]?.dietaryRestrictions?.trim() ||
        (inv.guests.length === 1 && inv.dietaryRestrictions?.trim())
    );
  }).length;

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
      {/* 1. TOP ROW: Title on Left, Mural de Recados in Middle, 4 Neutral Stat Cards on Right */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6 items-stretch">
        {/* Left (4 cols): Editorial Title & Story */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-4">
          <p className="admin-eyebrow text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#77736c]">
            Com carinho, cada detalhe
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-[#161616] leading-[1.08] tracking-tight">
            Quem faz parte da
            <br />
            nossa <em className="italic text-[#722F37]">história.</em>
          </h1>

          <p className="text-sm sm:text-base text-[#77736c] leading-relaxed">
            Um espaço para cuidar dos convites e de quem estará ao nosso lado.
            {weddingDateStr && formattedWeddingDate !== "Data a definir" && (
              <span className="block mt-2 text-sm sm:text-base text-[#161616] font-medium">
                {formattedWeddingDate}
                {daysUntilWedding !== null && daysUntilWedding > 0 && ` · Faltam ${daysUntilWedding} dias`}
              </span>
            )}
          </p>
        </div>

        {/* Middle (4 cols): Mural de Recados using ScrollArea (Where the red box was) */}
        <article className="lg:col-span-4 flex flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFDFB] p-4 sm:p-5 shadow-xs h-full min-h-[280px]">
          <div className="flex items-center justify-between pb-3 border-b border-[#1616160a]">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#722F3712] text-[#722F37]">
                <MessageSquareHeart size={15} />
              </span>
              <h3 className="text-xs sm:text-sm font-medium text-[#161616]">Mural de recados</h3>
            </div>
            <span className="rounded-full bg-[#16161608] px-2 py-0.5 text-[10px] font-medium text-[#6B6760]">
              {guestMessages.length} {guestMessages.length === 1 ? "recado" : "recados"}
            </span>
          </div>

          <ScrollArea className="flex-1 mt-3 -mr-2 pr-2.5 max-h-[220px]" showScrollButtons={guestMessages.length > 2}>
            {guestMessages.length > 0 ? (
              <div className="space-y-2.5">
                {guestMessages.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#1616160a] bg-[#FAF7F5] p-3 text-xs space-y-1 transition-colors hover:border-[#722F3725]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#161616] text-[11px] truncate">{item.name}</span>
                      <Heart size={11} className="text-[#722F37] fill-[#722F37] shrink-0" />
                    </div>
                    <p className="text-[11px] text-[#6B6760] italic leading-relaxed">
                      “{item.message}”
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 px-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#722F3710] text-[#722F37] mb-2">
                  <MessageSquareHeart size={18} />
                </span>
                <p className="text-xs font-medium text-[#161616]">Nenhum recado ainda</p>
                <p className="mt-1 text-[11px] text-[#8C877F] max-w-[200px] leading-relaxed">
                  Conforme seus convidados confirmarem presença, os recados aparecerão aqui.
                </p>
              </div>
            )}
          </ScrollArea>
        </article>

        {/* Right (4 cols): 4 Stat Cards in 2x2 Grid - All Identical Styling (Confirmados is NOT red) */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-3" aria-label="Resumo de convidados">
          {/* Card 1: Convidados ativos */}
          <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFDFB] p-4 shadow-xs transition-all hover:border-[#722F3730]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-3 text-[#161616] opacity-[0.05] rotate-[-12deg]">
              <Users size={80} />
            </span>
            <p className="relative text-xs font-medium text-[#6B6760]">Convidados ativos</p>
            <strong className="relative my-1 font-serif text-3xl sm:text-4xl font-normal text-[#161616]">
              {loading ? "…" : totalGuests}
            </strong>
            <span className="relative text-[11px] text-[#8C877F]">
              {plan === "essencial" ? `${totalGuests} de 50 vagas` : `${totalInvites} convites cadastrados`}
            </span>
          </article>

          {/* Card 2: Confirmados (Identical neutral style like the others, NOT red) */}
          <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFDFB] p-4 shadow-xs transition-all hover:border-[#722F3730]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-3 text-[#161616] opacity-[0.05] rotate-[-12deg]">
              <CheckCircle2 size={80} />
            </span>
            <p className="relative text-xs font-medium text-[#6B6760]">Confirmados</p>
            <strong className="relative my-1 font-serif text-3xl sm:text-4xl font-normal text-[#161616]">
              {loading ? "…" : confirmedGuests.length}
            </strong>
            <span className="relative text-[11px] text-[#8C877F]">
              {totalGuests > 0 ? `${confirmedPct}% de presença confirmada` : "Aguardando respostas"}
            </span>
          </article>

          {/* Card 3: Pendentes */}
          <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFDFB] p-4 shadow-xs transition-all hover:border-[#722F3730]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-3 text-[#161616] opacity-[0.05] rotate-[-12deg]">
              <Clock size={80} />
            </span>
            <p className="relative text-xs font-medium text-[#6B6760]">Pendentes</p>
            <strong className="relative my-1 font-serif text-3xl sm:text-4xl font-normal text-[#161616]">
              {loading ? "…" : pendingGuests.length}
            </strong>
            <span className="relative text-[11px] text-[#8C877F]">
              {totalGuests > 0 ? `${pendingPct}% aguardando resposta` : "Nenhuma pendência"}
            </span>
          </article>

          {/* Card 4: Não comparecerão */}
          <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFDFB] p-4 shadow-xs transition-all hover:border-[#722F3730]">
            <span aria-hidden="true" className="pointer-events-none absolute -right-3 -bottom-3 text-[#161616] opacity-[0.05] rotate-[-12deg]">
              <UserX size={80} />
            </span>
            <p className="relative text-xs font-medium text-[#6B6760]">Não comparecerão</p>
            <strong className="relative my-1 font-serif text-3xl sm:text-4xl font-normal text-[#161616]">
              {loading ? "…" : declinedGuests.length}
            </strong>
            <span className="relative text-[11px] text-[#8C877F]">
              {totalGuests > 0 ? `${declinedPct}% justificaram ausência` : "Nenhum recusado"}
            </span>
          </article>
        </div>
      </section>

      {/* 2. UNIFIED PANEL: Seu Site & Andamento do Casamento */}
      <section className="overflow-hidden rounded-2xl border border-[#722F3725] bg-[#FFFDFB] shadow-xs">
        <div className="grid grid-cols-1 divide-y divide-[#722F3715] lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
          {/* Left Side: Seu Site */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77736c]">
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
                  href={weddingPath("site")}
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
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77736c]">
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
              <div className="mt-4 space-y-2.5">
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

                <div className="h-3 w-full overflow-hidden rounded-full bg-[#EFECE6] flex" aria-hidden="true">
                  {confirmedPct > 0 && (
                    <div style={{ width: `${confirmedPct}%` }} className="bg-[#722F37]" title={`Confirmados: ${confirmedGuests.length}`} />
                  )}
                  {declinedPct > 0 && (
                    <div style={{ width: `${declinedPct}%` }} className="bg-[#C4A4A9]" title={`Recusados: ${declinedGuests.length}`} />
                  )}
                  {pendingPct > 0 && (
                    <div style={{ width: `${pendingPct}%` }} className="bg-[#D8D2C7]" title={`Pendentes: ${pendingGuests.length}`} />
                  )}
                </div>

                {/* Legenda com quadrados coloridos */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-[#6B6760]">
                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[2px] bg-[#722F37] shrink-0" aria-hidden="true" />
                    <span>
                      <strong className="text-[#161616] font-medium">{confirmedGuests.length}</strong> confirmados ({confirmedPct}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[2px] bg-[#D8D2C7] shrink-0 border border-[#16161615]" aria-hidden="true" />
                    <span>
                      <strong className="text-[#161616] font-medium">{pendingGuests.length}</strong> pendentes ({pendingPct}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-[2px] bg-[#C4A4A9] shrink-0" aria-hidden="true" />
                    <span>
                      <strong className="text-[#161616] font-medium">{declinedGuests.length}</strong> recusados ({declinedPct}%)
                    </span>
                  </div>
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
                    <Link href={weddingPath("buffet")} className="font-semibold underline">
                      {dietaryCount} {dietaryCount === 1 ? "convidado informou" : "convidados informaram"}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Link to Guest List */}
            <div className="pt-2">
              <Link
                href={weddingPath("guests")}
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
