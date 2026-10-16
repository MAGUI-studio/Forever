"use client";

import {
  ArrowUpRight,
  Armchair,
  Check,
  Heart,
  History,
  Loader2,
  Users,
  UserCheck,
} from "lucide-react";
import Image from "next/image";
import { AdminDialog } from "./AdminDialog";
import { PLAN_PRICING, UPGRADE_PRICING } from "@/config/pricing";

const benefits = [
  {
    icon: Users,
    title: "Todo mundo na sua lista",
    description: "Convidados ilimitados, sem o limite de 50 do Essencial.",
  },
  {
    icon: Armchair,
    title: "Um lugar para cada pessoa",
    description: "Organize mesas e lugares antes do grande dia.",
  },
  {
    icon: UserCheck,
    title: "Uma chegada mais tranquila",
    description: "Sua equipe consulta a lista e registra as chegadas.",
  },
  {
    icon: History,
    title: "Cada detalhe sob controle",
    description: "Histórico de alterações e restrições para o buffet.",
  },
];

export function UpgradePlanDialog({
  open,
  busy,
  error,
  onClose,
  onContinue,
}: {
  open: boolean;
  busy: boolean;
  error: string;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <AdminDialog
      open={open}
      busy={busy}
      onClose={onClose}
      wide
      eyebrow="Seu próximo capítulo · Forever PRO"
      ornaments={false}
      title="Na sua história, cabe todo mundo."
      description="Mais liberdade para convidar. Mais tranquilidade para organizar o dia de vocês."
    >
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
        <ul className="grid grid-cols-1 gap-5">
          {benefits.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#722F370a] text-[#722F37]">
                <Icon size={18} strokeWidth={1.6} aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold leading-relaxed text-neutral-900">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div>
          <div className="relative isolate overflow-hidden rounded-2xl bg-[#722F37] p-5 text-white">
            <Heart
              size={160}
              className="pointer-events-none absolute -bottom-12 -right-8 -z-10 -rotate-12 opacity-[0.07]"
              aria-hidden="true"
            />
            <p className="flex items-center gap-2 text-xs font-medium text-white/90">
              <Check size={15} aria-hidden="true" />
              Seu Essencial já vale {PLAN_PRICING.essencial.formattedPrice} de crédito
            </p>
            <dl className="mt-4 space-y-2 text-xs text-white/75">
              <div className="flex justify-between gap-3">
                <dt>Valor do Forever PRO</dt>
                <dd>{PLAN_PRICING.foreverPro.formattedPrice}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Crédito do seu plano</dt>
                <dd>− {PLAN_PRICING.essencial.formattedPrice}</dd>
              </div>
            </dl>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-2 border-t border-white/20 pt-4">
              <div>
                <p className="text-xs text-white/85">Para completar seu plano</p>
                <p className="mt-1 text-[11px] text-white/70">Pagamento único · sem mensalidade</p>
              </div>
              <strong className="text-3xl font-semibold tracking-tight text-white">
                {UPGRADE_PRICING.formattedPrice}
              </strong>
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-neutral-500">
            <Check size={15} className="mt-0.5 shrink-0 text-[#722F37]" aria-hidden="true" />
            Tudo o que vocês já organizaram continua aqui: convites, convidados e confirmações
            preservados.
          </p>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onContinue}
        className="group mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#722F37] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5B252C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#722F37] disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? (
          <Loader2 size={17} className="shrink-0 animate-spin" aria-hidden="true" />
        ) : (
          <Heart size={17} className="shrink-0" aria-hidden="true" />
        )}
        {busy ? "Abrindo pagamento…" : "Quero meu casamento com Forever PRO"}
        {!busy && (
          <ArrowUpRight
            size={17}
            className="shrink-0 transition-transform duration-300 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none"
            aria-hidden="true"
          />
        )}
      </button>
      <p className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-neutral-500">
        <span>Você continua para o pagamento pela</span>
        <Image
          src="/utils/logo_stripe.svg"
          alt="Stripe"
          width={48}
          height={20}
          className="h-5 w-auto"
        />
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={onClose}
        className="mt-4 min-h-10 w-full rounded-lg text-xs text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-[#722F37] disabled:opacity-50"
      >
        Continuar no Essencial por enquanto
      </button>
    </AdminDialog>
  );
}
