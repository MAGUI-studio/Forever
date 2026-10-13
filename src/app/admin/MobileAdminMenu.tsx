"use client";
import {sectionModule} from "@/config/modules";
import {useWedding} from "@/components/wedding/WeddingProvider";
import {useState} from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import {AnimatePresence, motion, useReducedMotion} from "framer-motion";
import {Menu, X, Users, Check, LayoutDashboard, Settings, LogOut, ArrowUpRight} from "lucide-react";

type MobileAdminMenuProps = {
  section: "site" | "site-settings" | "overview" | "guests" | "check-in" | "tables" | "buffet" | "history" | "team";
  role: "admin" | "reception";
  email: string | null;
  busy: boolean;
  authorized: boolean;
  onSettings: () => void;
  onSignOut: () => void;
};

export function MobileAdminMenu({role,section,email,busy,authorized,onSettings,onSignOut}:MobileAdminMenuProps) {
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
    <Dialog.Trigger asChild><button type="button" aria-label="Abrir menu" className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--wedding-radius)] text-[var(--forever-primary,#5D613C)] transition-colors hover:bg-[var(--forever-hover-tint,#5d613c10)] focus-visible:outline-2 focus-visible:outline-[var(--forever-primary,#5D613C)] lg:hidden"><Menu size={24} /></button></Dialog.Trigger>
    <AnimatePresence>
      {open && <Dialog.Portal forceMount>
        <Dialog.Overlay asChild forceMount><motion.div className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reducedMotion ? 0 : .25}} /></Dialog.Overlay>
        <Dialog.Content asChild forceMount><motion.div className="fixed inset-y-0 right-0 z-[310] flex w-[min(360px,90vw)] flex-col overflow-y-auto bg-[#fffdfa] p-6 text-[var(--forever-primary,#5D613C)] shadow-2xl outline-none" initial={{x:reducedMotion ? 0 : "100%"}} animate={{x:0}} exit={{x:reducedMotion ? 0 : "100%"}} transition={{duration:reducedMotion ? 0 : .4,ease:[.22,1,.36,1]}}>
          <div className="flex items-center justify-between gap-4"><Dialog.Title className="font-serif text-3xl">Nosso casamento</Dialog.Title><Dialog.Close asChild><button type="button" aria-label="Fechar menu" className="flex size-11 items-center justify-center rounded-[var(--wedding-radius)] hover:bg-[var(--forever-hover-tint,#5d613c10)]"><X size={22} /></button></Dialog.Close></div>
          <Dialog.Description className="mt-2 text-xs text-[var(--forever-accent,#80654E)]">Espaço dos noivos</Dialog.Description>
          <nav aria-label="Menu mobile do painel" className="mt-8 flex flex-col gap-2">
            {links.filter(link=>(role === "admin" || link.key === "check-in")&&(!sectionModule[link.key]||modules[sectionModule[link.key]!])).map(({href,label,key,icon:Icon}) => <Link key={key} href={path(href)} onClick={()=>setOpen(false)} aria-current={section === key ? "page" : undefined} className={"flex min-h-14 items-center gap-3 rounded-[var(--wedding-radius)] px-4 text-sm transition-colors hover:bg-[var(--forever-hover-tint,#5d613c10)] " + (section === key ? "bg-[#5d613c10] font-semibold" : "")}><Icon size={19} />{label}</Link>)}
            <Link href={path()} target="_blank" rel="noopener noreferrer" onClick={()=>setOpen(false)} className="flex min-h-14 items-center gap-3 rounded-[var(--wedding-radius)] px-4 text-sm transition-colors hover:bg-[var(--forever-hover-tint,#5d613c10)]"><ArrowUpRight size={19} aria-hidden="true"/>Ver site</Link>
            {modules.rsvp&&<button type="button" disabled={busy || !authorized || role !== "admin"} onClick={()=>{setOpen(false);onSettings();}} className="flex min-h-14 items-center gap-3 rounded-[var(--wedding-radius)] px-4 text-sm hover:bg-[var(--forever-hover-tint,#5d613c10)] disabled:opacity-40"><Settings size={19} />Configurações</button>}
          </nav>
          <div className="mt-auto pt-10"><p className="break-all px-4 text-xs text-[var(--forever-accent,#80654E)]">{email}</p><button type="button" disabled={busy} onClick={()=>{setOpen(false);onSignOut();}} className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-[var(--wedding-radius)] px-4 text-sm hover:bg-[var(--forever-hover-tint,#5d613c10)] disabled:opacity-40"><LogOut size={18} />Sair da conta</button></div>
        </motion.div></Dialog.Content>
      </Dialog.Portal>}
    </AnimatePresence>
  </Dialog.Root>;
}
