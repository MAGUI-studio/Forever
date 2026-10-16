"use client";
import { dashboardSummary } from "@/lib/dashboard-summary";
import { PRO_SUPPORT_URL } from "@/config/plan-access";
import { notify } from "@/components/ui/ForeverToaster";

import { useMemo, useState } from "react";
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
  "minimalist-modern": "Minimalista Moderno",
  "serene-breeze": "Brisa Serena",
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

  const totalGuests = guests.length;
  const {
    confirmedGuests,
    pendingGuests,
    declinedGuests,
    confirmedPct,
    pendingPct,
    declinedPct,
    totalInvites,
    sentInvites,
    openedInvites,
    sentPct,
    guestMessages,
    dietaryCount,
  } = useMemo(() => dashboardSummary(guests, invitations), [guests, invitations]);

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
      daysUntilWedding = Math.ceil(
        (targetDay.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24),
      );
    }
  }

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
      daysUntilRsvp = Math.ceil(
        (targetDay.getTime() - startToday.getTime()) / (1000 * 60 * 60 * 24),
      );
    }
  }

  async function handleCopySiteLink() {
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${origin}${weddingPath()}`;
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      notify.success("Link do site copiado!", "Pronto para compartilhar.");
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      notify.error("Não foi possível copiar", "Tente copiar o link novamente.");
    }
  }

  return (
    <div className="flex flex-col gap-8 pt-8 pb-12 sm:pt-12 lg:block lg:space-y-8">
      <section className="contents lg:grid lg:grid-cols-12 lg:gap-6 lg:items-stretch">
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
                {daysUntilWedding !== null &&
                  daysUntilWedding > 0 &&
                  ` · Faltam ${daysUntilWedding} dias`}
              </span>
            )}
          </p>
        </div>

        <article className="order-last lg:order-none lg:col-span-4 flex flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5 shadow-xs h-full min-h-[280px]">
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

          <ScrollArea
            className="flex-1 mt-3 -mr-2 pr-2.5 max-h-[220px]"
            showScrollButtons={guestMessages.length > 2}
          >
            {guestMessages.length > 0 ? (
              <div className="space-y-2.5">
                {guestMessages.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-[#1616160a] bg-white p-3 text-xs space-y-1 transition-colors hover:border-[#722F3725]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#161616] text-[11px] truncate">
                        {item.name}
                      </span>
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

        <div className="lg:col-span-4 grid grid-cols-2 gap-3" aria-label="Resumo de convidados">
          <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs transition-all hover:border-[#722F3730]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 -bottom-3 text-[#161616] opacity-[0.05] rotate-[-12deg]"
            >
              <Users size={80} />
            </span>
            <p className="relative text-xs font-medium text-[#6B6760]">Convidados ativos</p>
            <strong className="relative my-1 font-serif text-3xl sm:text-4xl font-normal text-[#161616]">
              {loading ? "…" : totalGuests}
            </strong>
            <span className="relative text-[11px] text-[#8C877F]">
              {plan === "essencial"
                ? `${totalGuests} de 50 vagas`
                : `${totalInvites} convites cadastrados`}
            </span>
          </article>

          <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs transition-all hover:border-[#722F3730]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 -bottom-3 text-[#161616] opacity-[0.05] rotate-[-12deg]"
            >
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

          <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs transition-all hover:border-[#722F3730]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 -bottom-3 text-[#161616] opacity-[0.05] rotate-[-12deg]"
            >
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

          <article className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs transition-all hover:border-[#722F3730]">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -right-3 -bottom-3 text-[#161616] opacity-[0.05] rotate-[-12deg]"
            >
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

      {plan === "essencial" && (
        <section
          aria-labelledby="pro-upgrade-title"
          className="relative isolate overflow-hidden rounded-2xl border border-[#722F37] bg-[#722F37] p-6 text-white shadow-sm sm:p-7"
        >
          <Heart
            size={220}
            className="pointer-events-none absolute -right-8 -bottom-16 -z-10 -rotate-12 text-white opacity-[0.06]"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/75">
                O próximo passo da sua celebração · Forever PRO
              </p>
              <h2
                id="pro-upgrade-title"
                className="font-serif text-2xl font-normal leading-tight text-white sm:text-3xl"
              >
                Na sua história, cabe todo mundo.
              </h2>
              <p className="text-sm leading-relaxed text-white/85">
                Troque o limite de 50 por convidados ilimitados. Organize mesas, equipe e chegadas
                em um só lugar, com a tranquilidade de ter cada detalhe sob controle.
              </p>
              <p className="text-xs font-medium text-white/90">
                Os R$ 497 do seu Essencial já contam: complete seu plano com mais R$ 500, em
                pagamento único.
              </p>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2 lg:w-auto lg:items-end">
              <button
                type="button"
                disabled={upgradeLoading}
                onClick={onUpgrade}
                className="group inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-[#722F37] shadow-sm transition-colors hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white disabled:opacity-60 lg:w-auto"
              >
                {upgradeLoading ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Heart size={16} aria-hidden="true" />
                )}
                {upgradeLoading ? "Abrindo…" : "Quero conhecer o Forever PRO"}
                {!upgradeLoading && (
                  <ArrowUpRight
                    size={16}
                    className="transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-focus-visible:-translate-y-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                )}
              </button>
              <span className="text-center text-[11px] text-white/75 lg:text-right">
                Seus convites e confirmações continuam com vocês.
              </span>
            </div>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-xs">
        <div className="grid grid-cols-1 divide-y divide-[#722F3715] lg:grid-cols-2 lg:divide-y-0 lg:divide-x">
          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Tudo à mão
              </p>
              <h2 className="mt-2 font-serif text-2xl text-neutral-900 sm:text-3xl">
                O que vamos organizar hoje?
              </h2>
            </div>
            <div className="divide-y divide-neutral-100">
              <Link
                href={weddingPath("convidados")}
                className="group flex items-center gap-3 rounded-xl px-2 py-4 transition-colors hover:bg-neutral-50"
              >
                <Users size={20} className="shrink-0 text-[#722F37]" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">Cuidar dos convites</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {totalInvites - sentInvites} convites ainda não marcados como enviados
                  </p>
                </div>
                <ArrowUpRight
                  size={17}
                  className="shrink-0 text-neutral-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              {modules.siteEditor && (
                <Link
                  href={weddingPath("editar-site")}
                  className="group flex items-center gap-3 rounded-xl px-2 py-4 transition-colors hover:bg-neutral-50"
                >
                  <Pencil size={20} className="shrink-0 text-[#722F37]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">
                      Deixar o site com a cara de vocês
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Edite fotos, textos e informações da celebração.
                    </p>
                  </div>
                  <ArrowUpRight
                    size={17}
                    className="shrink-0 text-neutral-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              )}
              {modules.tables && (
                <Link
                  href={weddingPath("mesas")}
                  className="group flex items-center gap-3 rounded-xl px-2 py-4 transition-colors hover:bg-neutral-50"
                >
                  <CheckCircle2 size={20} className="shrink-0 text-[#722F37]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900">Organizar os lugares</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {confirmedGuests.filter((guest) => !guest.tableId).length} confirmados sem
                      mesa · {tables.length} mesas cadastradas
                    </p>
                  </div>
                  <ArrowUpRight
                    size={17}
                    className="shrink-0 text-neutral-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              )}
            </div>
            {plan === "foreverPro" && (
              <a
                href={PRO_SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-[#722F37] transition-colors hover:border-[#722F37]"
              >
                <span>Suporte prioritário pelo WhatsApp</span>
                <ArrowUpRight size={17} aria-hidden="true" />
              </a>
            )}
            <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-4">
              <span className="mr-auto min-w-0 break-all text-xs text-neutral-500">
                Site público <span className="ml-1 text-neutral-800">{weddingPath()}</span>
              </span>
              <button
                type="button"
                onClick={handleCopySiteLink}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                {copiedLink ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
                {copiedLink ? "Copiado" : "Copiar link"}
              </button>
              <Link
                href={weddingPath()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs text-neutral-600 transition-colors hover:bg-neutral-100"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Ver site
              </Link>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
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

              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-[#161616]">
                  <span className="text-[#6B6760]">Taxa de resposta</span>
                  <span className="font-semibold text-[#722F37]">
                    {confirmedGuests.length + declinedGuests.length} de {totalGuests} respondidos (
                    {totalGuests > 0
                      ? Math.round(
                          ((confirmedGuests.length + declinedGuests.length) / totalGuests) * 100,
                        )
                      : 0}
                    %)
                  </span>
                </div>

                <div
                  className="h-3 w-full overflow-hidden rounded-full bg-[#EFECE6] flex"
                  aria-hidden="true"
                >
                  {confirmedPct > 0 && (
                    <div
                      style={{ width: `${confirmedPct}%` }}
                      className="bg-[#722F37]"
                      title={`Confirmados: ${confirmedGuests.length}`}
                    />
                  )}
                  {declinedPct > 0 && (
                    <div
                      style={{ width: `${declinedPct}%` }}
                      className="bg-[#C4A4A9]"
                      title={`Recusados: ${declinedGuests.length}`}
                    />
                  )}
                  {pendingPct > 0 && (
                    <div
                      style={{ width: `${pendingPct}%` }}
                      className="bg-[#D8D2C7]"
                      title={`Pendentes: ${pendingGuests.length}`}
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-[#6B6760]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-[2px] bg-[#722F37] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-[#161616] font-medium">
                        {confirmedGuests.length}
                      </strong>{" "}
                      confirmados ({confirmedPct}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-[2px] bg-[#D8D2C7] shrink-0 border border-[#16161615]"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-[#161616] font-medium">{pendingGuests.length}</strong>{" "}
                      pendentes ({pendingPct}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="size-2.5 rounded-[2px] bg-[#C4A4A9] shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="text-[#161616] font-medium">
                        {declinedGuests.length}
                      </strong>{" "}
                      recusados ({declinedPct}%)
                    </span>
                  </div>
                </div>
              </div>

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
                      {dietaryCount}{" "}
                      {dietaryCount === 1 ? "convidado informou" : "convidados informaram"}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={weddingPath("convidados")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#722F37] hover:underline"
              >
                <span>Ver lista completa de convidados</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
