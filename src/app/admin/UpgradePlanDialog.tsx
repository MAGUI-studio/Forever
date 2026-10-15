"use client";

import { ArrowUpRight, Check, Loader2, Users } from "lucide-react";
import { AdminDialog } from "./AdminDialog";
import { PLAN_PRICING, UPGRADE_PRICING } from "@/config/pricing";

export function UpgradePlanDialog({open,busy,error,onClose,onContinue}:{open:boolean;busy:boolean;error:string;onClose:()=>void;onContinue:()=>void}) {
 return <AdminDialog open={open} busy={busy} onClose={onClose} title="Mais espaço para celebrar." description="Conheça o Forever PRO e continue sua lista sem limite de convidados.">
  <div className="relative isolate mt-5 overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5">
   <Users size={160} className="pointer-events-none absolute -bottom-8 -right-8 -z-10 -rotate-12 text-[#722F37] opacity-[0.04]" aria-hidden="true" />
   <p className="text-xs font-semibold uppercase tracking-wider text-[#722F37]">Forever PRO</p>
   <ul className="mt-4 space-y-3 text-sm text-neutral-700">{["Convidados ilimitados","Organização de mesas e lugares","Controle de chegada e equipe da recepção","Histórico de alterações e resumo para o buffet"].map(item=><li key={item} className="flex items-center gap-2"><Check size={16} className="shrink-0 text-[#722F37]" aria-hidden="true" />{item}</li>)}</ul>
  </div>
  <div className="mt-5 space-y-2 rounded-xl bg-neutral-50 p-4 text-sm">
   <div className="flex justify-between gap-4 text-neutral-500"><span>Forever PRO</span><span>{PLAN_PRICING.foreverPro.formattedPrice}</span></div>
   <div className="flex justify-between gap-4 text-neutral-500"><span>Crédito do plano Essencial</span><span>− {PLAN_PRICING.essencial.formattedPrice}</span></div>
   <div className="flex justify-between gap-4 border-t border-neutral-200 pt-3 font-semibold text-neutral-900"><span>Você paga somente a diferença</span><span>{UPGRADE_PRICING.formattedPrice}</span></div>
   <p className="text-xs text-neutral-500">Pagamento único. Seus convites e confirmações são preservados.</p>
  </div>
  {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
  <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
   <button type="button" disabled={busy} onClick={onClose} className="guest-secondary">Continuar no Essencial</button>
   <button type="button" disabled={busy} onClick={onContinue} className="guest-button">{busy?<Loader2 size={16} className="animate-spin" aria-hidden="true" />:<ArrowUpRight size={16} aria-hidden="true" />}{busy?"Abrindo pagamento…":`Continuar para pagamento · ${UPGRADE_PRICING.formattedPrice}`}</button>
  </div>
 </AdminDialog>;
}
