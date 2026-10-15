"use client";
import { useTableSearch, useExpandedInvitations, useQueryState, kindParser, orderParser, parseAsStringLiteral, tableUrlOptions } from "./table-url-state";
import { AdminPageHeading } from "./AdminPageHeading";

import { GuestNames } from "@/components/ui/GuestNames";
import { Fragment, useMemo } from "react";
import { Search, RefreshCw, Check, Undo2, Users, Clock, DoorOpen, ChevronDown, ArrowDown, ArrowUp, X, CircleCheck } from "lucide-react";
import { useWedding } from "@/components/wedding/WeddingProvider";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import { AdminTable, AdminTableDetails, shouldToggleTableRow } from "@/components/ui/AdminTable";
import type { Invitation, EventTable } from "@/types/guests";

type CheckInListProps = {
  invitations: Invitation[];
  tables: EventTable[];
  busy: boolean;
  loading?: boolean;
  onToggle: (invitation: Invitation, guestIds: string[], checkedIn: boolean) => void;
  onRefresh: () => void;
};
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
const actionClass = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-40";

function ArrivalBadge({ arrived }: { arrived: boolean }) {
  const Icon = arrived ? CircleCheck : Clock;
  return <span className={`relative isolate inline-flex min-h-9 w-[200px] items-center justify-center overflow-hidden rounded-full px-4 py-2 text-xs font-medium ${arrived ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-700"}`}>
    <Icon size={46} strokeWidth={1.5} className="pointer-events-none absolute -right-1 -bottom-2 -z-10 -rotate-12 opacity-[0.09]" aria-hidden="true" />
    <span>{arrived ? "Já chegou" : "Aguardando chegada"}</span>
  </span>;
}

export function CheckInList({ invitations, tables, busy, loading = false, onToggle, onRefresh }: CheckInListProps) {
  const { modules } = useWedding();
  const [query, setQuery] = useTableSearch();
  const [filter, setFilter] = useQueryState("arrival", parseAsStringLiteral(["all","arrived","waiting"]).withDefault("all").withOptions(tableUrlOptions));
  const [kind, setKind] = useQueryState("kind", kindParser.withOptions(tableUrlOptions));
  const [direction, setDirection] = useQueryState("direction", orderParser.withOptions(tableUrlOptions));
  const descending = direction === "desc";
  const [expanded, setExpanded] = useExpandedInvitations(invitations.map(invitation => invitation.id));
  const tableMap = useMemo(() => new Map(tables.map(table => [table.id, table.name])), [tables]);
  const active = invitations.filter(invitation => invitation.active);
  const confirmed = active.flatMap(invitation => invitation.guests.filter(guest => guest.status === "confirmado"));
  const arrived = confirmed.filter(guest => guest.checkedIn).length;
  const groups = active.map(invitation => ({ invitation, guests: invitation.guests.filter(guest => guest.status === "confirmado" && normalize(`${guest.name} ${invitation.label} ${modules.tables ? tableMap.get(guest.tableId ?? "") ?? "" : ""}`).includes(normalize(query)) && (filter === "all" || (filter === "arrived" ? guest.checkedIn : !guest.checkedIn))) })).filter(item => item.guests.length);
  const isGroup = (invitation: Invitation) => invitation.kind === "group" || (!invitation.kind && invitation.guests.length > 1);
  const counts = { all: groups.length, group: groups.filter(({ invitation }) => isGroup(invitation)).length, individual: groups.filter(({ invitation }) => !isGroup(invitation)).length };
  const visible = groups.filter(({ invitation }) => kind === "all" || (kind === "group" ? isGroup(invitation) : !isGroup(invitation))).sort((a, b) => a.invitation.label.localeCompare(b.invitation.label, "pt-BR") * (descending ? -1 : 1));
  const visibleGuests = visible.flatMap(item => item.guests);
  const allExpanded = visible.length > 0 && visible.every(({ invitation }) => expanded[invitation.id]);
  const toggle = (id: string) => setExpanded(current => ({ ...current, [id]: !current[id] }));
  const colSpan = modules.tables ? 6 : 5;
  const blocked = busy || loading;

  return <div className="space-y-6 pb-16 pt-6 sm:pt-8">
    <div className="grid grid-cols-1 items-center gap-6 border-b border-neutral-200/80 pb-6 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,3fr)]">
      <AdminPageHeading context="O grande dia chegou" title="Controle de" accent="chegada" description="Receba e acompanhe os convidados confirmados." />
      <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-3" aria-label="Resumo da recepção" aria-busy={loading}>
        {[{ label: "Confirmados", count: confirmed.length, icon: Users, caption: "Pessoas esperadas" }, { label: "Já chegaram", count: arrived, icon: DoorOpen, caption: confirmed.length ? `${Math.round(arrived / confirmed.length * 100)}% dos confirmados` : "Aguardando chegadas" }, { label: "Aguardando", count: confirmed.length - arrived, icon: Clock, caption: "Ainda não chegaram" }].map(({ label, count, icon: Icon, caption }) => <article key={label} className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
          <Icon size={80} className="pointer-events-none absolute -bottom-3 -right-3 -rotate-12 text-neutral-900 opacity-[0.04]" aria-hidden="true" />
          <p className="relative text-xs font-medium text-neutral-500">{label}</p><strong className="relative my-1 font-serif text-3xl font-normal text-neutral-900 sm:text-4xl">{loading ? "…" : count}</strong><span className="relative text-[11px] text-neutral-500">{caption}</span>
        </article>)}
      </div>
    </div>
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1 sm:max-w-[360px]">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
          <input aria-label="Buscar convidados confirmados" placeholder={modules.tables ? "Buscar por nome, família ou mesa..." : "Buscar por nome ou família..."} value={query} onChange={event => setQuery(event.target.value)} className="h-11 w-full rounded-xl border border-neutral-200 bg-white pl-9 pr-9 text-xs text-neutral-900 shadow-2xs outline-none placeholder:text-neutral-400 focus:border-[#722F37] focus:ring-2 focus:ring-[#722F3715]" />
          {query && <button type="button" aria-label="Limpar busca" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-500"><X size={14} /></button>}
        </div>
        <div className="w-full sm:w-[220px]"><WeddingSelect label="Filtrar chegada" value={filter} onValueChange={value => setFilter(value === "arrived" || value === "waiting" ? value : "all")} className="h-11! min-h-11! rounded-xl! border! border-neutral-200! bg-white! px-3! text-xs! text-neutral-900! shadow-2xs!" options={[{ value: "all", label: "Todos os confirmados" }, { value: "waiting", label: "Aguardando chegada" }, { value: "arrived", label: "Já chegaram" }]} /></div>
      </div>
      <button type="button" disabled={blocked} onClick={onRefresh} className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-xl border border-neutral-200 bg-white px-3.5 text-xs font-medium text-neutral-700 shadow-2xs hover:bg-neutral-50 disabled:opacity-50"><RefreshCw size={14} className={busy ? "animate-spin motion-reduce:animate-none" : ""} aria-hidden="true" />Atualizar</button>
    </div>
    <div className="guest-table-view overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs" aria-busy={blocked}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-3.5">
        <div className="flex flex-wrap gap-1.5" aria-label="Tipo de convite">
          {([{ value: "all", label: "Todos" }, { value: "group", label: "Famílias e grupos" }, { value: "individual", label: "Individuais" }] as const).map(tab => <button key={tab.value} type="button" aria-pressed={kind === tab.value} onClick={() => setKind(tab.value)} className={`inline-flex min-h-9 items-center gap-2 rounded-xl px-3.5 text-xs font-medium transition-colors ${kind === tab.value ? "bg-[#722F37] text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`}>{tab.label}<span className="opacity-70">({counts[tab.value]})</span></button>)}
        </div>
        <button type="button" disabled={!visible.length} onClick={() => setExpanded(current => ({ ...current, ...Object.fromEntries(visible.map(({ invitation }) => [invitation.id, !allExpanded])) }))} className={actionClass}><ChevronDown size={14} className={`transition-transform ${allExpanded ? "rotate-180" : ""}`} aria-hidden="true" />{allExpanded ? "Recolher todos" : "Expandir todos"}</button>
      </div>
      <p className="border-b border-neutral-100 bg-neutral-50/40 px-5 py-2.5 text-xs text-neutral-500">Clique na linha para ver as pessoas do convite e registrar a chegada. Atualização automática a cada 15 segundos.</p>
      <AdminTable label="Lista de recepção dos convidados confirmados" header={<>
        <th scope="col" className="w-9 px-3 py-3.5"><span className="sr-only">Expandir</span></th>
        <th scope="col" aria-sort={descending ? "descending" : "ascending"} className="px-5 py-3.5"><button type="button" onClick={() => setDirection(value => value === "asc" ? "desc" : "asc")} className="inline-flex items-center gap-1">Convite{descending ? <ArrowDown size={13} /> : <ArrowUp size={13} />}</button></th>
        <th scope="col" className="px-5 py-3.5">Convidados</th>
        <th scope="col" className="px-5 py-3.5">Chegada</th>
        {modules.tables && <th scope="col" className="px-5 py-3.5">Mesa</th>}
        <th scope="col" className="px-5 py-3.5 text-right">Ações</th>
      </>}>
        {loading ? <tr><td colSpan={colSpan} className="p-10 text-center text-sm text-neutral-500">Carregando recepção…</td></tr> : !visible.length ? <tr><td colSpan={colSpan} className="px-5 py-14 text-center"><Users size={28} className="mx-auto text-neutral-400" aria-hidden="true" /><p className="mt-3 text-sm font-medium text-neutral-800">{confirmed.length ? "Nenhum convidado encontrado" : "Aguardando as confirmações"}</p><p className="mt-2 text-xs text-neutral-500">{confirmed.length ? "Ajuste a busca ou os filtros para consultar outras pessoas." : "As pessoas com presença confirmada aparecerão aqui."}</p>{(query || filter !== "all" || kind !== "all") && <button type="button" className={`${actionClass} mt-3`} onClick={() => { setQuery(""); setFilter("all"); setKind("all"); }}>Limpar busca e filtros</button>}</td></tr> : visible.map(({ invitation, guests }) => {
          const open = !!expanded[invitation.id];
          const waiting = guests.filter(guest => !guest.checkedIn);
          const arrivedCount = guests.length - waiting.length;
          const assignedTables = [...new Set(guests.map(guest => tableMap.get(guest.tableId ?? "")).filter(Boolean))];
          return <Fragment key={invitation.id}>
            <tr data-invitation-expanded={open} className={`cursor-pointer transition-colors ${open ? "bg-white" : "hover:bg-neutral-50/40"}`} onClick={event => { if (shouldToggleTableRow(event.target)) toggle(invitation.id); }}>
              <td className="px-3 text-center"><button type="button" aria-label={`${open ? "Recolher" : "Expandir"} ${invitation.label}`} aria-expanded={open} aria-controls={`reception-${invitation.id}`} onClick={() => toggle(invitation.id)} className="inline-flex size-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"><ChevronDown size={15} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} /></button></td>
              <td className="px-5"><button type="button" aria-expanded={open} aria-controls={`reception-${invitation.id}`} onClick={() => toggle(invitation.id)} className="text-left text-sm font-medium uppercase text-neutral-900">{invitation.label}</button><p className="mt-1.5 text-xs text-neutral-500">{guests.length} {guests.length === 1 ? "pessoa nesta seleção" : "pessoas nesta seleção"}</p></td>
              <td className="max-w-72 px-5 text-xs leading-relaxed text-neutral-600"><GuestNames guests={guests} /></td>
              <td className="px-5">{waiting.length === 0 ? <ArrivalBadge arrived /> : arrivedCount === 0 ? <ArrivalBadge arrived={false} /> : <span className="relative isolate inline-flex min-h-9 w-[200px] items-center justify-center overflow-hidden rounded-full bg-neutral-100 px-4 py-2 text-xs font-medium text-neutral-700"><DoorOpen size={46} className="pointer-events-none absolute -bottom-2 -right-1 -z-10 -rotate-12 opacity-[0.09]" aria-hidden="true" />{arrivedCount} de {guests.length} chegaram</span>}</td>
              {modules.tables && <td className="px-5 text-xs text-neutral-500">{assignedTables.join(", ") || "Sem mesa"}</td>}
              <td className="px-5 text-right"><button type="button" disabled={blocked || !waiting.length} onClick={() => onToggle(invitation, waiting.map(guest => guest.id), true)} className={`${actionClass} whitespace-nowrap`}><Check size={16} aria-hidden="true" />{!waiting.length ? "Todos chegaram" : waiting.length === 1 ? "Registrar chegada" : `Registrar ${waiting.length} chegadas`}</button></td>
            </tr>
            <AdminTableDetails id={`reception-${invitation.id}`} expanded={open} colSpan={colSpan}>
              <div className="invitation-people overflow-x-auto px-4 pb-4 pt-1 sm:px-5">
                <table aria-label={`Pessoas confirmadas de ${invitation.label}`} className="w-full border-collapse text-left">
                  <thead><tr className="border-b border-neutral-100 text-[10px] uppercase tracking-wider text-neutral-400">
                    <th scope="col" className="py-3 pr-6 font-medium">Pessoa</th>
                    <th scope="col" className="px-3 py-3 font-medium">Situação</th>
                    {modules.tables && <th scope="col" className="px-3 py-3 font-medium">Mesa e lugar</th>}
                    <th scope="col" className="px-3 py-3 font-medium">Horário da chegada</th>
                    <th scope="col" className="py-3 pl-3 text-right font-medium">Ações</th>
                  </tr></thead>
                  <tbody className="divide-y divide-neutral-100">{guests.map(guest=><tr key={guest.id}>
                    <td className="whitespace-nowrap py-3.5 pr-6 text-sm font-medium text-neutral-800"><span className="uppercase">{guest.name}</span>{guest.child && <span className="ml-2 text-xs font-normal text-neutral-500">Criança</span>}</td>
                    <td className="whitespace-nowrap px-3 py-3.5"><ArrivalBadge arrived={guest.checkedIn} /></td>
                    {modules.tables && <td className="whitespace-nowrap px-3 py-3.5 text-xs text-neutral-600">{tableMap.get(guest.tableId ?? "") ?? "Sem mesa"}{guest.seat ? ` · Lugar ${guest.seat}` : ""}</td>}
                    <td className="whitespace-nowrap px-3 py-3.5 text-xs text-neutral-500">{guest.checkedIn && guest.checkedInAt ? <time dateTime={guest.checkedInAt}>{new Date(guest.checkedInAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</time> : "—"}</td>
                    <td className="whitespace-nowrap py-3.5 pl-3 text-right"><button type="button" disabled={blocked} aria-label={`${guest.checkedIn ? "Desfazer chegada de" : "Registrar chegada de"} ${guest.name}`} aria-pressed={guest.checkedIn} className={actionClass} onClick={()=>onToggle(invitation,[guest.id],!guest.checkedIn)}>{guest.checkedIn ? <Undo2 size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}{guest.checkedIn ? "Desfazer chegada" : "Registrar chegada"}</button></td>
                  </tr>)}</tbody>
                </table>
              </div>
            </AdminTableDetails>
          </Fragment>;
        })}
      </AdminTable>
      <div className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500" aria-live="polite">{visible.length} convites exibidos · {visibleGuests.length} pessoas nesta seleção · {visibleGuests.filter(guest => guest.checkedIn).length} já chegaram</div>
    </div>
  </div>;
}
