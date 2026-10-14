"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Send,
  Eye,
  MessageSquareHeart,
  Utensils,
  LayoutGrid,
  Copy,
  Check,
  Heart,
  Pencil,
  Plus,
  Settings,
  ChevronRight,
  ShieldCheck,
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
  const unsentInvites = totalInvites - sentInvites;
  const openedInvites = activeInvitations.filter((i) => !!i.openedAt).length;
  const sentPct = totalInvites > 0 ? Math.round((sentInvites / totalInvites) * 100) : 0;
  const openedPct = totalInvites > 0 ? Math.round((openedInvites / totalInvites) * 100) : 0;

  // Real messages left by guests (either personal responses or invitation-level)
  const guestMessages: { name: string; message: string; status: string }[] = [];
  invitations.forEach((inv) => {
    if (inv.personalResponses) {
      Object.entries(inv.personalResponses).forEach(([guestId, resp]) => {
        if (resp.message && resp.message.trim().length > 0) {
          const g = inv.guests.find((guest) => guest.id === guestId);
          guestMessages.push({
            name: g ? g.name : inv.label,
            message: resp.message.trim(),
            status: g?.status ?? "confirmado",
          });
        }
      });
    }
    if (inv.message && inv.message.trim().length > 0) {
      const alreadyAdded = guestMessages.some((m) => m.message === inv.message.trim());
      if (!alreadyAdded) {
        guestMessages.push({
          name: inv.label,
          message: inv.message.trim(),
          status: inv.guests.some((g) => g.status === "confirmado") ? "confirmado" : "pendente",
        });
      }
    }
  });

  // Real dietary restrictions
  const dietaryGuests: { name: string; restriction: string }[] = [];
  invitations.forEach((inv) => {
    inv.guests.forEach((g) => {
      const personal = inv.personalResponses?.[g.id]?.dietaryRestrictions?.trim();
      const inviteLevel = inv.guests.length === 1 ? inv.dietaryRestrictions?.trim() : "";
      const restriction = personal || inviteLevel;
      if (restriction) {
        dietaryGuests.push({
          name: g.name,
          restriction,
        });
      }
    });
    if (inv.dietaryRestrictions && inv.dietaryRestrictions.trim().length > 0 && inv.guests.length > 1) {
      const already = dietaryGuests.some((d) => d.restriction === inv.dietaryRestrictions.trim());
      if (!already) {
        dietaryGuests.push({
          name: inv.label,
          restriction: inv.dietaryRestrictions.trim(),
        });
      }
    }
  });

  // Real tables & seating
  const totalCapacity = tables.reduce((acc, t) => acc + (t.capacity || 0), 0);
  const seatedGuests = guests.filter((g) => !!g.tableId).length;
  const unseatedConfirmed = Math.max(0, confirmedGuests.length - seatedGuests);

  // Real reception check-in
  const checkedInGuests = guests.filter((g) => g.checkedIn);

  // Date parsing & countdowns
  const coupleNames =
    weddingConfig.couple.partner1 && weddingConfig.couple.partner2
      ? `${weddingConfig.couple.partner1} & ${weddingConfig.couple.partner2}`
      : "Nosso Casamento";

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
    <div className="space-y-6 pb-12">
      {/* 1. HERO BANNER: Welcome, Countdown & Quick Action Hub */}
      <section className="relative overflow-hidden rounded-2xl border border-[#722F3725] bg-gradient-to-br from-[#FFFDFB] via-[#FFFDFB] to-[#722F370c] p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#722F3730] bg-[#722F3710] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#722F37]">
                <Sparkles size={12} className="text-[#722F37]" />
                Painel do Grande Dia
              </span>

              {daysUntilWedding !== null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#16161615] bg-white px-3 py-1 text-[11px] font-medium text-[#161616] shadow-2xs">
                  <Calendar size={12} className="text-[#722F37]" />
                  {daysUntilWedding > 0
                    ? `Faltam ${daysUntilWedding} dias para o casamento`
                    : daysUntilWedding === 0
                    ? "O Grande Dia é hoje!"
                    : "Casamento celebrado"}
                </span>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#161616] tracking-tight">
              {coupleNames}
            </h1>

            <p className="text-xs sm:text-sm text-[#6B6760] leading-relaxed">
              {formattedWeddingDate}
              {weddingConfig.couple.locationSummary && ` · ${weddingConfig.couple.locationSummary}`}
              {weddingConfig.ceremony.time && ` · Cerimônia às ${weddingConfig.ceremony.time}`}
            </p>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {modules.guestList && (
              <button
                type="button"
                onClick={onOpenNewInvite}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#722F37] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all duration-200 hover:bg-[#5B252C] hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Plus size={15} />
                <span>Novo convite</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopySiteLink}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#722F3730] bg-white px-3.5 py-2.5 text-xs font-medium text-[#722F37] transition-all duration-200 hover:border-[#722F37] hover:bg-[#722F370a] shadow-xs cursor-pointer"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedLink ? "Link copiado!" : "Copiar link do site"}</span>
            </button>

            {modules.siteEditor && (
              <Link
                href={weddingPath("admin/site")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#722F3730] bg-white px-3.5 py-2.5 text-xs font-medium text-[#722F37] transition-all duration-200 hover:border-[#722F37] hover:bg-[#722F370a] shadow-xs"
              >
                <Pencil size={14} />
                <span>Personalizar site</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* 2. STATS OVERVIEW: 4 Cards with Real Breakdown & Context */}
      <section aria-label="Estatísticas gerais de convidados">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* Total Guests */}
          <article className="relative overflow-hidden rounded-2xl border border-[#722F3725] bg-[#FFFDFB] p-4 sm:p-5 shadow-xs transition-all hover:border-[#722F3740]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B6760]">Total de convidados</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#722F3710] text-[#722F37]">
                <Users size={16} />
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-[#161616]">
              {loading ? "…" : totalGuests}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#8C877F]">
              <span>
                {plan === "essencial" ? `${totalGuests} de 50 vagas ocupadas` : "Ilimitado no plano PRO"}
              </span>
              <span className="font-medium text-[#722F37]">{totalInvites} convites</span>
            </div>
          </article>

          {/* Confirmed Guests */}
          <article className="relative overflow-hidden rounded-2xl border border-[#722F3735] bg-[#722F370d] p-4 sm:p-5 shadow-xs transition-all hover:border-[#722F37]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#722F37]">Confirmados</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#722F37] text-white shadow-2xs">
                <CheckCircle2 size={16} />
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl sm:text-4xl font-semibold text-[#722F37]">
              {loading ? "…" : confirmedGuests.length}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#722F37]">
              <span>{totalGuests > 0 ? `${confirmedPct}% dos convidados` : "Aguardando confirmações"}</span>
              <span className="font-semibold">Presença garantida</span>
            </div>
          </article>

          {/* Pending Guests */}
          <article className="relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFDFB] p-4 sm:p-5 shadow-xs transition-all hover:border-[#722F3730]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B6760]">Pendentes</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#EFECE6] text-[#7A756D]">
                <Clock size={16} />
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-[#161616]">
              {loading ? "…" : pendingGuests.length}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#8C877F]">
              <span>{totalGuests > 0 ? `${pendingPct}% aguardando` : "Sem pendências"}</span>
              <span className="font-medium text-[#80654E]">Aguardando RSVP</span>
            </div>
          </article>

          {/* Declined Guests */}
          <article className="relative overflow-hidden rounded-2xl border border-[#E5E0D8] bg-[#FFFDFB] p-4 sm:p-5 shadow-xs transition-all hover:border-[#722F3730]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#6B6760]">Não comparecerão</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-[#EFECE6] text-[#8C877F]">
                <UserX size={16} />
              </span>
            </div>
            <p className="mt-3 font-serif text-3xl sm:text-4xl font-normal text-[#6B6760]">
              {loading ? "…" : declinedGuests.length}
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#8C877F]">
              <span>{totalGuests > 0 ? `${declinedPct}% justificaram` : "Nenhum recusado"}</span>
              <span>Ausência informada</span>
            </div>
          </article>
        </div>

        {/* Multi-segment Live Progress Bar */}
        {totalGuests > 0 && (
          <div className="mt-3 rounded-xl border border-[#722F3715] bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#161616] mb-2 font-medium">
              <span>Balanço de Respostas do RSVP</span>
              <span className="text-[#722F37] font-semibold">
                {confirmedGuests.length + declinedGuests.length} de {totalGuests} respondidos (
                {totalGuests > 0
                  ? Math.round(((confirmedGuests.length + declinedGuests.length) / totalGuests) * 100)
                  : 0}
                %)
              </span>
            </div>

            <div className="h-3 w-full overflow-hidden rounded-full bg-[#F3EFEA] flex" aria-hidden="true">
              {confirmedPct > 0 && (
                <div
                  style={{ width: `${confirmedPct}%` }}
                  className="bg-[#722F37] transition-all duration-500"
                  title={`Confirmados: ${confirmedPct}%`}
                />
              )}
              {declinedPct > 0 && (
                <div
                  style={{ width: `${declinedPct}%` }}
                  className="bg-[#C4A4A9] transition-all duration-500"
                  title={`Recusados: ${declinedPct}%`}
                />
              )}
              {pendingPct > 0 && (
                <div
                  style={{ width: `${pendingPct}%` }}
                  className="bg-[#E5DFD7] transition-all duration-500"
                  title={`Pendentes: ${pendingPct}%`}
                />
              )}
            </div>

            <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[11px] text-[#6B6760]">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#722F37]" />
                <strong>{confirmedGuests.length}</strong> confirmados ({confirmedPct}%)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#E5DFD7]" />
                <strong>{pendingGuests.length}</strong> pendentes ({pendingPct}%)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#C4A4A9]" />
                <strong>{declinedGuests.length}</strong> recusados ({declinedPct}%)
              </span>
              {formattedRsvpDeadline && (
                <span className="ml-auto text-[#8C877F]">
                  Prazo: {formattedRsvpDeadline}
                  {daysUntilRsvp !== null && daysUntilRsvp >= 0
                    ? ` (faltam ${daysUntilRsvp} dias)`
                    : " (encerrado)"}
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* 3. TWO-COLUMN MAIN WORKSPACE */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Engagement, Invitations Delivery & Messages (7 cols) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Card: Status de Envio e Engajamento dos Convites */}
          {modules.guestList && (
            <article className="rounded-2xl border border-[#722F3720] bg-[#FFFDFB] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#722F3715]">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#722F3712] text-[#722F37]">
                    <Send size={16} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#161616]">Envio e Leitura dos Convites</h2>
                    <p className="text-[11px] text-[#8C877F]">Acompanhamento em tempo real das entregas</p>
                  </div>
                </div>

                <Link
                  href={weddingPath("admin/guests")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#722F37] hover:underline"
                >
                  <span>Ver lista completa</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
                {/* Enviados */}
                <div className="rounded-xl border border-[#16161610] bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B6760]">Enviados aos convidados</span>
                    <Send size={14} className="text-[#722F37]" />
                  </div>
                  <p className="mt-2 font-serif text-2xl font-semibold text-[#161616]">
                    {sentInvites} <span className="text-xs font-sans font-normal text-[#8C877F]">/ {totalInvites}</span>
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F3EFEA]">
                    <div style={{ width: `${sentPct}%` }} className="h-full bg-[#722F37]" />
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#8C877F]">
                    {unsentInvites > 0 ? `${unsentInvites} convites aguardando envio` : "Todos os convites foram marcados como enviados"}
                  </p>
                </div>

                {/* Visualizados */}
                <div className="rounded-xl border border-[#16161610] bg-white p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#6B6760]">Abertos pelos convidados</span>
                    <Eye size={14} className="text-emerald-700" />
                  </div>
                  <p className="mt-2 font-serif text-2xl font-semibold text-[#161616]">
                    {openedInvites} <span className="text-xs font-sans font-normal text-[#8C877F]">/ {totalInvites}</span>
                  </p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F3EFEA]">
                    <div style={{ width: `${openedPct}%` }} className="h-full bg-emerald-700" />
                  </div>
                  <p className="mt-1.5 text-[10px] text-[#8C877F]">
                    {openedInvites > 0 ? `${openedPct}% de taxa de abertura do link` : "Nenhum link aberto até o momento"}
                  </p>
                </div>
              </div>
            </article>
          )}

          {/* Card: Recados dos Convidados (Mensagens Reais) */}
          <article className="rounded-2xl border border-[#722F3720] bg-[#FFFDFB] p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#722F3715]">
              <div className="flex items-center gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-lg bg-[#722F3712] text-[#722F37]">
                  <MessageSquareHeart size={16} />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-[#161616]">Mural de Recados</h2>
                  <p className="text-[11px] text-[#8C877F]">Mensagens e votos deixados pelos convidados no RSVP</p>
                </div>
              </div>

              {guestMessages.length > 0 && (
                <span className="rounded-full bg-[#722F3712] px-2.5 py-0.5 text-xs font-semibold text-[#722F37]">
                  {guestMessages.length} {guestMessages.length === 1 ? "recado" : "recados"}
                </span>
              )}
            </div>

            <div className="mt-4">
              {guestMessages.length > 0 ? (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {guestMessages.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-[#722F3715] bg-white p-3.5 shadow-2xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#722F37]">{item.name}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#722F3710] px-2 py-0.5 text-[10px] font-medium text-[#722F37]">
                          <Heart size={10} className="fill-[#722F37]" />
                          Confirmado
                        </span>
                      </div>
                      <p className="text-xs text-[#302329] italic leading-relaxed">
                        “{item.message}”
                      </p>
                    </div>
                  ))}
                  {guestMessages.length > 5 && (
                    <p className="text-center text-xs text-[#8C877F] pt-1">
                      + {guestMessages.length - 5} outros recados na lista de convidados
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-[#722F3725] bg-[#FAF7F5] p-6 text-center">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-[#722F3712] text-[#722F37] mb-2.5">
                    <MessageSquareHeart size={20} />
                  </div>
                  <h3 className="text-xs font-semibold text-[#161616]">Nenhum recado recebido ainda</h3>
                  <p className="mt-1 text-[11px] text-[#6B6760] max-w-sm mx-auto leading-relaxed">
                    Conforme seus convidados confirmarem presença através do formulário do site, os votos de felicidade e mensagens carinhosas aparecerão aqui.
                  </p>
                </div>
              )}
            </div>
          </article>

          {/* Card: Restrições Alimentares / Buffet (Dados Reais) */}
          {modules.buffet && (
            <article className="rounded-2xl border border-[#722F3720] bg-[#FFFDFB] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#722F3715]">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#722F3712] text-[#722F37]">
                    <Utensils size={16} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#161616]">Alimentação & Buffet</h2>
                    <p className="text-[11px] text-[#8C877F]">Restrições e cuidados informados no RSVP</p>
                  </div>
                </div>

                <Link
                  href={weddingPath("admin/buffet")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#722F37] hover:underline"
                >
                  <span>Gerenciar buffet</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              <div className="mt-4">
                {dietaryGuests.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-[#6B6760] mb-2 font-medium">
                      {dietaryGuests.length} {dietaryGuests.length === 1 ? "convidado informou" : "convidados informaram"} restrição alimentar:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {dietaryGuests.slice(0, 4).map((d, idx) => (
                        <div key={idx} className="rounded-lg border border-[#16161610] bg-white p-2.5 text-xs">
                          <span className="font-semibold text-[#161616] block">{d.name}</span>
                          <span className="text-[#722F37] text-[11px]">{d.restriction}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-[#16161610] bg-white p-3.5 text-xs text-[#6B6760]">
                    <ShieldCheck size={18} className="text-emerald-700 shrink-0" />
                    <span>Nenhuma restrição alimentar cadastrada pelos convidados confirmados até o momento.</span>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>

        {/* RIGHT COLUMN: Website, Seating, Organization & Upgrade (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Card: Seu Site de Casamento (Redesenhado de forma completa e rica) */}
          {modules.siteEditor && (
            <article className="relative overflow-hidden rounded-2xl border border-[#722F3725] bg-[#FFFDFB] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#722F3715]">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#722F3712] text-[#722F37]">
                    <Pencil size={16} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#161616]">Seu Site de Casamento</h2>
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                      <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      Publicado e acessível
                    </span>
                  </div>
                </div>

                <span className="rounded-full border border-[#722F3725] bg-[#722F370a] px-2.5 py-0.5 text-[10px] font-semibold text-[#722F37]">
                  {TEMPLATE_NAMES[templateId] ?? "Romance"}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-[#16161610] bg-[#FAF7F5] p-3 text-xs space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-[#8C877F] tracking-wider block">
                    Endereço público do site
                  </span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-[#161616] truncate font-medium">
                      /casamento/{slug}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySiteLink}
                      className="shrink-0 p-1 rounded hover:bg-white text-[#722F37] cursor-pointer"
                      title="Copiar endereço"
                    >
                      {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={weddingPath("admin/site")}
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-[#722F37] px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-[#5B252C] shadow-2xs"
                  >
                    <Pencil size={13} />
                    <span>Personalizar</span>
                  </Link>

                  <Link
                    href={weddingPath()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-[#722F3730] bg-white px-3 py-2 text-xs font-medium text-[#722F37] transition-all hover:bg-[#722F370a]"
                  >
                    <ExternalLink size={13} />
                    <span>Ver site</span>
                  </Link>
                </div>
              </div>
            </article>
          )}

          {/* Card: Organização do Evento (Mesas & Portaria) */}
          {modules.organization && (
            <article className="rounded-2xl border border-[#722F3720] bg-[#FFFDFB] p-5 sm:p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-[#722F3715]">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[#722F3712] text-[#722F37]">
                    <LayoutGrid size={16} />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-[#161616]">Gestão do Grande Dia</h2>
                    <p className="text-[11px] text-[#8C877F]">Assentos, mesas e recepção</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {modules.tables && (
                  <Link
                    href={weddingPath("admin/tables")}
                    className="group flex items-center justify-between rounded-xl border border-[#16161610] bg-white p-3.5 text-xs transition-all hover:border-[#722F3730] hover:bg-[#722F3706]"
                  >
                    <div>
                      <span className="font-semibold text-[#161616] block group-hover:text-[#722F37]">
                        Mesas e lugares
                      </span>
                      <span className="text-[11px] text-[#8C877F]">
                        {tables.length} mesas · {seatedGuests} lugares ocupados de {totalCapacity}
                        {unseatedConfirmed > 0 && ` (${unseatedConfirmed} confirmados sem mesa)`}
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-[#8C877F] group-hover:text-[#722F37]" />
                  </Link>
                )}

                {modules.checkIn && (
                  <Link
                    href={weddingPath("admin/check-in")}
                    className="group flex items-center justify-between rounded-xl border border-[#16161610] bg-white p-3.5 text-xs transition-all hover:border-[#722F3730] hover:bg-[#722F3706]"
                  >
                    <div>
                      <span className="font-semibold text-[#161616] block group-hover:text-[#722F37]">
                        Portaria e check-in ao vivo
                      </span>
                      <span className="text-[11px] text-[#8C877F]">
                        {checkedInGuests.length} de {confirmedGuests.length} confirmados deram entrada
                      </span>
                    </div>
                    <ChevronRight size={14} className="text-[#8C877F] group-hover:text-[#722F37]" />
                  </Link>
                )}

                {modules.rsvp && (
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    className="group flex w-full items-center justify-between rounded-xl border border-[#16161610] bg-white p-3.5 text-xs text-left transition-all hover:border-[#722F3730] hover:bg-[#722F3706] cursor-pointer"
                  >
                    <div>
                      <span className="font-semibold text-[#161616] block group-hover:text-[#722F37]">
                        Regras do RSVP & Prazo
                      </span>
                      <span className="text-[11px] text-[#8C877F]">
                        {formattedRsvpDeadline ? `Encerra em ${formattedRsvpDeadline}` : "Prazo flexível"} · WhatsApp e recados
                      </span>
                    </div>
                    <Settings size={14} className="text-[#8C877F] group-hover:text-[#722F37]" />
                  </button>
                )}
              </div>
            </article>
          )}

          {/* Card: Forever PRO Upgrade Banner (apenas se plano for essencial) */}
          {plan === "essencial" && (
            <section className="relative overflow-hidden rounded-2xl border border-[#722F3730] bg-gradient-to-br from-[#FFFDFB] via-[#FFFDFB] to-[#722F370e] p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-1.5 font-semibold text-[#722F37] text-xs">
                <Heart size={13} className="fill-[#722F37]" />
                <span>Upgrade disponível · Forever PRO</span>
              </div>
              <h3 className="mt-2 font-serif text-xl font-normal text-[#161616]">
                Desbloqueie convidados <em className="italic text-[#722F37]">ilimitados</em>
              </h3>
              <p className="mt-1.5 text-xs text-[#6B6760] leading-relaxed">
                Seu plano Essencial tem limite de até 50 convidados. Com o PRO, vocês têm convidados sem limites, mesas, check-in na portaria e templates exclusivos.
              </p>
              <button
                type="button"
                disabled={upgradeLoading}
                onClick={onUpgrade}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#722F37] py-2.5 px-4 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#5B252C] disabled:opacity-60 cursor-pointer"
              >
                {upgradeLoading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Iniciando checkout…</span>
                  </>
                ) : (
                  <>
                    <Heart size={13} className="fill-white" />
                    <span>Fazer upgrade para Forever PRO (R$ 500)</span>
                    <ArrowUpRight size={13} />
                  </>
                )}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
