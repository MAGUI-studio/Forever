"use client";
import {useWedding} from "@/components/wedding/WeddingProvider";

import {DashboardSkeleton} from "./skeleton";
import {AdminContainer} from "./AdminContainer";
import {useState} from "react";
import {Search, RefreshCw, Check, Undo2, Users, Clock, DoorOpen} from "lucide-react";
import {WeddingSelect} from "@/components/ui/WeddingSelect";
import {AttendanceBadge} from "@/components/ui/AttendanceBadge";
import {ExpandingIconButton, ExpandingIconButtonGroup} from "@/components/ui/ExpandingIconButton";
import {SectionDivider} from "@/components/ui/SectionDivider";
import {WeddingBranch} from "@/components/wedding/WeddingOrnaments";
import type {Invitation,EventTable} from "@/types/guests";

type CheckInListProps = {
  invitations: Invitation[];
  tables: EventTable[];
  busy: boolean;
  loading?: boolean;
  onToggle: (invitation:Invitation, guestIds:string[], checkedIn:boolean) => void;
  onRefresh: () => void;
};
const normalize = (value:string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

export function CheckInList({invitations,tables,busy,loading = false,onToggle,onRefresh}:CheckInListProps) {
  const {modules}=useWedding();
  const [query,setQuery] = useState("");
  const [filter,setFilter] = useState("all");
  const active = invitations.filter(i => i.active);
  const confirmed = active.flatMap(i => i.guests.filter(g => g.status === "confirmado"));
  const arrived = confirmed.filter(g => g.checkedIn).length;
  const filtered = active.map(invitation => ({invitation, guests:invitation.guests.filter(guest => guest.status === "confirmado" && normalize(guest.name + " " + invitation.label + " " + (tables.find(t=>t.id===guest.tableId)?.name??"")).includes(normalize(query)) && (filter === "all" || (filter === "arrived" ? guest.checkedIn : !guest.checkedIn)))})).filter(item => item.guests.length);
  const sections = [
    {id:"groups",title:"Famílias e grupos",items:filtered.filter(({invitation:i}) => i.kind === "group" || (!i.kind && i.guests.length > 1))},
    {id:"individuals",title:"Convites individuais",items:filtered.filter(({invitation:i}) => i.kind === "individual" || (!i.kind && i.guests.length === 1))},
  ];
  return <AdminContainer variant="content">
    <div className="flex items-start justify-between gap-5">
      <div><p className="text-[10px] tracking-[.22em] text-[var(--forever-primary,#5D613C)] uppercase">O grande dia chegou</p><h1 className="mt-3 font-serif text-4xl leading-tight text-[var(--forever-ink,#3D2501)] sm:text-5xl">Controle de <em className="text-[var(--forever-primary,#5D613C)]">chegada</em></h1><p className="mt-3 text-xs text-[var(--forever-accent,#80654E)]">Acompanhe a recepção dos convidados confirmados.</p></div>
      <span className="hidden h-20 w-20 shrink-0 overflow-hidden text-[var(--forever-primary,#5D613C)] opacity-40 sm:block [&>svg]:h-full [&>svg]:w-full" aria-hidden="true"><WeddingBranch /></span>
    </div>
    <div className="mt-7 grid grid-cols-3 gap-3 sm:gap-4">
      {[{label:"Confirmados",count:confirmed.length,icon:Users},{label:"Já chegaram",count:arrived,icon:DoorOpen},{label:"Aguardando",count:confirmed.length-arrived,icon:Clock}].map(({label,count,icon:Icon},index) => <div key={label} className={"relative isolate overflow-hidden rounded-[var(--wedding-radius)] p-4 sm:p-5 " + (index === 1 ? "bg-[var(--forever-primary,#5D613C)] text-[#F5F5DA]" : "bg-[#fffdfa] text-[var(--forever-primary,#5D613C)]")}><Icon size={78} className="pointer-events-none absolute -right-3 -bottom-3 -z-10 -rotate-12 opacity-10" aria-hidden="true" /><p className="text-[10px] sm:text-xs">{label}</p><p className="mt-3 font-serif text-3xl sm:text-4xl">{loading ? <span className="inline-block h-[1em] w-[1ch] animate-pulse rounded bg-current opacity-15 motion-reduce:animate-none" /> : count}</p></div>)}
    </div>
    <div className="flex flex-col gap-4 py-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(220px,340px)_220px] sm:gap-6">
        <label className="flex min-h-12 min-w-0 items-center gap-3 rounded-[var(--wedding-radius)] border border-[#5d613c30] bg-[#fffdfa] px-3 text-[var(--forever-primary,#5D613C)] transition-shadow focus-within:ring-2 focus-within:ring-[#5d613c20]"><Search size={19} className="shrink-0" aria-hidden="true" /><input aria-label="Buscar convidados confirmados" className="h-12 w-full min-w-0 border-0! bg-transparent text-sm text-[var(--forever-ink,#3D2501)] outline-none! ring-0! shadow-none! placeholder:text-[#8a887b]" placeholder="Buscar nome, família ou mesa" value={query} onChange={event=>setQuery(event.target.value)} /></label>
        <WeddingSelect label="Filtrar chegada" className="h-12! min-h-12! border! border-[#5d613c30]! bg-[#fffdfa]! px-3! text-sm! shadow-none!" value={filter} onValueChange={setFilter} options={[{value:"all",label:"Todos os confirmados"},{value:"waiting",label:"Aguardando chegada"},{value:"arrived",label:"Já chegaram"}]} />
      </div>
      <button type="button" disabled={busy} onClick={onRefresh} className="inline-flex min-h-11 items-center justify-center gap-2 self-end rounded-[var(--wedding-radius)] px-3 text-xs text-[var(--forever-primary,#5D613C)] transition-colors hover:bg-[var(--forever-hover-tint,#5d613c10)] disabled:opacity-50"><RefreshCw size={16} className={busy ? "animate-spin" : ""} aria-hidden="true" />Atualizar</button>
    </div>
    <p className="mb-4 text-[10px] text-[var(--forever-accent,#80654E)]">Atualização automática a cada 15 segundos enquanto esta página estiver aberta. Use “Desfazer chegada” para corrigir uma marcação.</p>
    <div className="space-y-8">
      {loading && <DashboardSkeleton checkIn />}
      {sections.filter(section=>section.items.length).map(section=><section key={section.id} className="space-y-5"><SectionDivider title={section.title} count={section.items.length} />
        {section.items.map(({invitation,guests})=><article key={invitation.id} className="rounded-[var(--wedding-radius)] border border-[#c7b79d59] bg-[#fffefbdb] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-serif text-3xl text-[var(--forever-ink,#3D2501)]">{invitation.label}</h2>{guests.filter(g=>!g.checkedIn).length>1&&<button disabled={busy} type="button" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--wedding-radius)] px-3 text-xs text-[var(--forever-primary,#5D613C)] hover:bg-[var(--forever-hover-tint,#5d613c10)] disabled:opacity-40" onClick={()=>onToggle(invitation,guests.filter(g=>!g.checkedIn).map(g=>g.id),true)}><Check size={16}/>Registrar chegada de {guests.filter(g=>!g.checkedIn).length} pessoas</button>}</div>
          <p className="mt-2 text-xs text-[var(--forever-accent,#80654E)]">{guests.length} {guests.length === 1 ? "pessoa" : "pessoas"} nesta lista</p>
          <div className="mt-4 divide-y divide-[#c7b79d40]">{guests.map(guest=><div key={guest.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-4 last:pb-0 sm:flex sm:justify-between">
            <div className="min-w-0"><p className="text-sm break-words text-[var(--forever-primary,#5D613C)]">{guest.name}{guest.child ? " · Criança" : ""}</p>{modules.tables&&<p className="mt-1 text-xs text-[var(--forever-accent,#80654E)]">{tables.find(t=>t.id===guest.tableId)?.name??"Mesa ainda não definida"}{guest.seat?" · Lugar "+guest.seat:""}</p>}{guest.checkedInAt&&<p className="mt-1 text-[10px] text-[var(--forever-accent,#80654E)]">Chegada às {new Date(guest.checkedInAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</p>}</div>
            <div className="contents sm:flex sm:items-center sm:gap-3">
              <AttendanceBadge status={guest.checkedIn ? "confirmado" : "pendente"} label={guest.checkedIn ? "Já chegou" : "Aguardando chegada"} className="w-[145px]! text-[11px]!" />
              <ExpandingIconButtonGroup className="col-span-2 flex justify-end"><ExpandingIconButton icon={guest.checkedIn ? <Undo2 size={17} aria-hidden="true" /> : <Check size={17} aria-hidden="true" />} label={guest.checkedIn ? "Desfazer chegada" : "Registrar chegada"} aria-label={(guest.checkedIn ? "Desfazer chegada de " : "Registrar chegada de ") + guest.name} aria-pressed={guest.checkedIn} disabled={busy} onClick={()=>onToggle(invitation,[guest.id],!guest.checkedIn)} /></ExpandingIconButtonGroup>
            </div>
          </div>)}</div>
        </article>)}
      </section>)}
      {!loading && !filtered.length && <div className="rounded-[var(--wedding-radius)] bg-[#fffdfa] px-6 py-12 text-center"><Users size={28} className="mx-auto text-[var(--forever-primary,#5D613C)]" aria-hidden="true" /><h2 className="mt-4 font-serif text-2xl text-[var(--forever-ink,#3D2501)]">{confirmed.length ? "Nenhum convidado encontrado" : "Aguardando as confirmações"}</h2><p className="mt-3 text-sm text-[var(--forever-accent,#80654E)]">{confirmed.length ? "Ajuste a busca ou o filtro para consultar outras pessoas." : "Os convidados com presença confirmada aparecerão aqui."}</p></div>}
    </div>
  </AdminContainer>;
}
