"use client";
import {sectionModule} from "@/config/modules";
import {useWedding} from "@/components/wedding/WeddingProvider";
import {useState} from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {AnimatePresence, motion, useReducedMotion} from "framer-motion";
import {Menu, X, Users, Check, LayoutDashboard, Settings, LogOut, ArrowUpRight, Heart} from "lucide-react";
import {PLAN_NAMES, type WeddingPlan} from "@/config/forever";
import {ForeverLogo} from "@/components/forever/ForeverLogo";
import {foreverTheme} from "@/config/brand";

type MobileAdminMenuProps = {
  section: "site" | "site-settings" | "overview" | "guests" | "check-in" | "tables" | "buffet" | "history" | "team";
  role: "admin" | "reception";
  email: string | null;
  busy: boolean;
  authorized: boolean;
  plan?: WeddingPlan;
  onSettings: () => void;
  onSignOut: () => void;
  onUpgrade?: () => void;
};

export function MobileAdminMenu({role,section,email,busy,authorized,plan,onSettings,onSignOut,onUpgrade}:MobileAdminMenuProps) {
  const {path,modules}=useWedding();
  const [open,setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const links = [
    {href:"/admin/dashboard",label:"Visão geral",key:"overview",icon:LayoutDashboard},
    {href:"/admin/guests",label:"Lista de convidados",key:"guests",icon:Users},
    {href:"/admin/check-in",label:"Controle de chegada",key:"check-in",icon:Check},
    ...[{key:"site",label:"Personalizar site"},{key:"tables",label:"Mesas e lugares"},{key:"buffet",label:"Alimentação e buffet"},{key:"history",label:"Histórico de alterações"},{key:"team",label:"Equipe da recepção"}].map(item=>({...item,href:"/admin/"+item.key,icon:LayoutDashboard})),
  ];
  return <Dialog.Root open={open} onOpenChange={setOpen}>
    <Dialog.Trigger asChild><button type="button" aria-label="Abrir menu" className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--wedding-radius)] text-[#722F37] transition-colors hover:bg-[#722F370d] focus-visible:outline-2 focus-visible:outline-[#722F37] lg:hidden"><Menu size={24} /></button></Dialog.Trigger>
    <AnimatePresence>
      {open && <Dialog.Portal forceMount>
        <Dialog.Overlay asChild forceMount><motion.div className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reducedMotion ? 0 : .25}} /></Dialog.Overlay>
        <Dialog.Content asChild forceMount><motion.div style={foreverTheme} className="fixed inset-y-0 right-0 z-[310] flex w-[min(360px,90vw)] flex-col overflow-y-auto bg-[#fffdfa] p-6 text-[#161616] shadow-2xl outline-none" initial={{x:reducedMotion ? 0 : "100%"}} animate={{x:0}} exit={{x:reducedMotion ? 0 : "100%"}} transition={{duration:reducedMotion ? 0 : .4,ease:[.22,1,.36,1]}}>
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title asChild>
              <div className="flex items-center gap-2.5">
                <ForeverLogo className="w-24" />
                <span className="h-5 w-px bg-[#722f3725]" aria-hidden="true" />
                <img
                  src={plan === "essencial" ? "/forever/subscription/essential_plan.svg" : "/forever/subscription/pro_plan.svg"}
                  alt={PLAN_NAMES[plan ?? "foreverPro"]}
                  className="h-6 w-auto object-contain"
                />
              </div>
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" aria-label="Fechar menu" className="flex size-11 items-center justify-center rounded-[var(--wedding-radius)] text-[#722F37] hover:bg-[#722F370d]">
                <X size={22} />
              </button>
            </Dialog.Close>
          </div>
          <nav aria-label="Menu mobile do painel" className="mt-8 flex flex-col gap-2">
            {links.filter(link=>(role === "admin" || link.key === "check-in")&&(!sectionModule[link.key]||modules[sectionModule[link.key]!])).map(({href,label,key,icon:Icon}) => <Link key={key} href={path(href)} onClick={()=>setOpen(false)} aria-current={section === key ? "page" : undefined} className={"flex min-h-14 items-center gap-3 rounded-[var(--wedding-radius)] px-4 text-sm transition-colors hover:bg-[#722F370d] " + (section === key ? "bg-[#722F3714] font-semibold text-[#722F37]" : "text-[#161616]")}><Icon size={19} className={section === key ? "text-[#722F37]" : "text-[#77736c]"} />{label}</Link>)}
            <Link href={path()} target="_blank" rel="noopener noreferrer" onClick={()=>setOpen(false)} className="flex min-h-14 items-center gap-3 rounded-[var(--wedding-radius)] px-4 text-sm text-[#722F37] transition-colors hover:bg-[#722F370d]"><ArrowUpRight size={19} aria-hidden="true"/>Ver site</Link>
            {modules.rsvp&&<button type="button" disabled={busy || !authorized || role !== "admin"} onClick={()=>{setOpen(false);onSettings();}} className="flex min-h-14 items-center gap-3 rounded-[var(--wedding-radius)] px-4 text-sm hover:bg-[#722F370d] disabled:opacity-40 text-[#161616]"><Settings size={19} className="text-[#77736c]" />Configurações</button>}
          </nav>
          {plan === "essencial" && role === "admin" && (
            <div className="mt-6 rounded-xl border border-[#722F3730] bg-[#722F370d] p-4 text-xs text-[#161616]">
              <div className="flex items-center gap-1.5 font-semibold text-[#722F37]">
                <Heart size={12} className="fill-[#722F37]" />
                <span>Upgrade para Forever PRO</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#6B6760]">
                Desbloqueie convidados ilimitados, mesas e portaria com check-in ao vivo.
              </p>
              {onUpgrade ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setOpen(false);
                    onUpgrade();
                  }}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#722F37] py-2 text-center text-xs font-medium text-white transition-colors hover:bg-[#5b242b] disabled:opacity-60"
                >
                  <Heart size={12} className="fill-white" />
                  <span>Fazer upgrade para Forever PRO</span>
                  <ArrowUpRight size={13} />
                </button>
              ) : (
                <a
                  href="/#preco"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[#722F37] py-2 text-center text-xs font-medium text-white transition-colors hover:bg-[#5b242b]"
                >
                  <span>Conhecer o plano PRO</span>
                  <ArrowUpRight size={13} />
                </a>
              )}
            </div>
          )}
          <div className="mt-auto pt-8"><p className="break-all px-4 text-xs text-[var(--forever-accent,#77736c)]">{email}</p><button type="button" disabled={busy} onClick={()=>{setOpen(false);onSignOut();}} className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-[var(--wedding-radius)] px-4 text-sm text-[#722F37] hover:bg-[#722F370d] disabled:opacity-40"><LogOut size={18} />Sair da conta</button></div>
        </motion.div></Dialog.Content>
      </Dialog.Portal>}
    </AnimatePresence>
  </Dialog.Root>;
}
