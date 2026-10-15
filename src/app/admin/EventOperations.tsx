"use client";
import { useTableSearch, useQueryState, parseAsString, parseAsStringLiteral, parseAsBoolean, tableUrlOptions } from "./table-url-state";
import { AdminTable } from "@/components/ui/AdminTable";
import { TooltipButton } from "@/components/ui/TooltipButton";
import { useFeedbackToasts } from "@/components/ui/ForeverToaster";
import {AdminLoading} from "./AdminLoading";
import {useWedding} from "@/components/wedding/WeddingProvider";
import { useEffect, useState, useId, type ReactNode } from "react";
import { AdminDialog } from "./AdminDialog";
import {
  Armchair,
  Utensils,
  Baby,
  History,
  Users,
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { useOperationsModal } from "./modal-state";
import { AdminButton } from "./AdminButton";
import { AdminPageHeading } from "./AdminPageHeading";
import { AdminContainer } from "./AdminContainer";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import type {
  Invitation,
  EventTable,
  AuditEntry,
  ReceptionMember,
  Guest,
} from "@/types/guests";
type Section = "tables" | "buffet" | "history" | "team";
type Props = {
  pageLoading?: boolean;
  section: Section;
  invitations: Invitation[];
  tables: EventTable[];
  api: (path: string, method?: string, data?: unknown) => Promise<any>;
  onRefresh: () => Promise<void>;
};
const titles = {
  tables: "Mesas e lugares",
  buffet: "Alimentação e buffet",
  history: "Histórico de alterações",
  team: "Equipe da recepção",
};
const descriptions = {
  tables: "Organize os lugares de quem confirmou presença.",
  buffet:
    "Reúna as restrições alimentares para preparar uma recepção cuidadosa.",
  history:
    "Acompanhe as alterações feitas pela administração, recepção e convidados.",
  team: "Permita que sua equipe consulte a lista e registre chegadas.",
};
const input =
  "h-12 w-full rounded-[var(--wedding-radius)] border border-[#722f3730] bg-[#fffdfa] px-4 text-sm text-[var(--forever-ink,#161616)] outline-none focus:border-[var(--forever-primary,#722F37)] focus:ring-2 focus:ring-[#722f3720]";

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function EventOperations({
  pageLoading = false,
  section,
  invitations,
  tables,
  api,
  onRefresh,
}: Props) {
  const {modules}=useWedding();
  const [tableModal, setTableModal] = useOperationsModal();
  const tableModalOpen =
    section === "tables" &&
    (tableModal.action === "new-table" || tableModal.action === "edit-table");
  const teamModalOpen =
    section === "team" && tableModal.action === "grant-team-access";
  const editing =
    tableModal.action === "edit-table"
      ? (tableModal.table ?? undefined)
      : undefined;
  function closeTableModal() {
    setError("");
    void setTableModal(null, { history: "replace" });
  }

  const [query, setQuery] = useTableSearch();
  const
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<AuditEntry[]>([]),
    [team, setTeam] = useState<ReceptionMember[]>([]);
  const [name, setName] = useState(""),
    [capacity, setCapacity] = useState(8),
    [email, setEmail] = useState("");
  useEffect(() => {
    if (tableModal.action === "new-table") {
      setName("");
      setCapacity(8);
    } else if (tableModal.action === "edit-table") {
      const selected = tables.find((table) => table.id === tableModal.table);
      if (selected) {
        setName(selected.name);
        setCapacity(selected.capacity);
      }
    }
  }, [tableModal.action, tableModal.table, tables]);
  const [password, setPassword] = useState("");
  const [statusFilter, setStatusFilter] = useQueryState("access", parseAsStringLiteral(["all","active","revoked"]).withDefault("all").withOptions(tableUrlOptions));
  const [tableFilter, setTableFilter] = useQueryState("mesa", parseAsString.withDefault("all").withOptions(tableUrlOptions)),
    [onlyRestrictions, setOnlyRestrictions] = useQueryState("restrictions", parseAsBoolean.withDefault(true).withOptions(tableUrlOptions));
  useFeedbackToasts(error);
  async function refresh() {
    const data = await api("/api/admin/operations");
    setHistory(data.history);
    setTeam(data.team);
    setLoading(false);
  }
  useEffect(() => {
    void refresh().catch((e) => {
      setError(e.message);
      setLoading(false);
    });
  }, []);
  async function save(data: unknown) {
    setBusy(true);
    setError("");
    try {
      await api("/api/admin/operations", "POST", data);
      await onRefresh();
      await refresh();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar.");
      return false;
    } finally {
      setBusy(false);
    }
  }
  const confirmed = invitations
    .filter((i) => i.active)
    .flatMap((invitation) =>
      invitation.guests
        .filter((g) => g.status === "confirmado")
        .map((guest) => ({
          invitation,
          guest,
          restriction:
            invitation.personalResponses?.[guest.id]?.dietaryRestrictions ??
            (invitation.guests.length === 1
              ? invitation.dietaryRestrictions
              : ""),
        })),
    );
  const filtered = confirmed.filter(
    ({ guest, invitation, restriction }) =>
      normalize(
        guest.name + " " + invitation.label + " " + restriction + " " + (tables.find(table => table.id === guest.tableId)?.name ?? ""),
      ).includes(normalize(query)) &&
      (tableFilter === "all" ||
        (tableFilter === "none"
          ? !guest.tableId
          : guest.tableId === tableFilter)),
  );
  const buffet = filtered.filter(
    (row) => !onlyRestrictions || row.restriction?.trim(),
  );
  const visibleTables = tables.filter(table => normalize(table.name).includes(normalize(query)));
  const visibleTeam = team.filter(member => normalize(member.email).includes(normalize(query)) && (statusFilter === "all" || (statusFilter === "active" ? member.active : !member.active)));
  const visibleHistory = history.filter(entry => normalize([entry.action, entry.actor, entry.target, entry.details].join(" ")).includes(normalize(query)));
  const pending = loading || pageLoading;
  if (pending) return <AdminLoading description={`Carregando ${titles[section].toLocaleLowerCase("pt-BR")}…`}/>;
  return (
    <AdminContainer variant="content">
      <div className="grid grid-cols-1 items-center gap-6 border-b border-neutral-200/80 pb-6 xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,3fr)]">
        <AdminPageHeading
          context={section === "tables" ? "Cada lugar, com carinho" : section === "team" ? "Quem cuida da recepção" : section === "history" ? "Cada detalhe registrado" : "Uma recepção cuidadosa"}
          title={section === "tables" ? "Mesas e" : section === "team" ? "Equipe da" : section === "history" ? "Histórico de" : "Alimentação e"}
          accent={section === "tables" ? "lugares" : section === "team" ? "recepção" : section === "history" ? "alterações" : "buffet"}
          description={descriptions[section]}
        />
        <div className="grid grid-cols-1 gap-3 min-[460px]:grid-cols-3" aria-label="Resumo da página">
          {(section === "tables" ? [{label:"Mesas",value:tables.length,icon:Armchair},{label:"Com mesa",value:confirmed.filter(row=>row.guest.tableId).length,icon:Check},{label:"Sem mesa",value:confirmed.filter(row=>!row.guest.tableId).length,icon:Users}]
          : section === "team" ? [{label:"Pessoas na equipe",value:team.length,icon:Users},{label:"Acessos ativos",value:team.filter(member=>member.active).length,icon:Check},{label:"Acessos revogados",value:team.filter(member=>!member.active).length,icon:X}]
          : section === "buffet" ? [{label:"Confirmados",value:confirmed.length,icon:Users},{label:"Com restrições",value:confirmed.filter(row=>row.restriction?.trim()).length,icon:Utensils},{label:"Crianças",value:confirmed.filter(row=>row.guest.child).length,icon:Baby}]
          : [{label:"Alterações",value:history.length,icon:History},{label:"Responsáveis",value:new Set(history.map(entry=>entry.actor)).size,icon:Users},{label:"Hoje",value:history.filter(entry=>new Date(entry.at).toLocaleDateString("pt-BR")===new Date().toLocaleDateString("pt-BR")).length,icon:History}]).map(({label,value,icon:Icon})=><article key={label} className="relative flex min-h-32 flex-col justify-between overflow-hidden rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs"><Icon size={80} className="pointer-events-none absolute -bottom-3 -right-3 -rotate-12 text-neutral-900 opacity-[0.04]" aria-hidden="true" /><p className="relative text-xs font-medium text-neutral-500">{label}</p><strong className="relative font-serif text-3xl font-normal text-neutral-900">{value}</strong><span className="relative text-[11px] text-neutral-400">{section === "buffet" ? "Convidados com presença confirmada" : section === "history" ? "Registros disponíveis" : section === "team" ? "Equipe da recepção" : "Organização de lugares"}</span></article>)}
        </div>
      </div>
      {error && (
        <p
          role="alert"
          className="mt-5 rounded-[var(--wedding-radius)] bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <fieldset disabled={busy || pending} className="min-w-0 border-0 p-0">
        <div className="my-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3.5 text-neutral-400 shadow-2xs focus-within:border-[#722F37] focus-within:ring-2 focus-within:ring-[#722f3715] sm:w-[360px] sm:shrink-0">
            <Search size={19} className="shrink-0" aria-hidden="true" />
            <input
              aria-label="Buscar nesta página"
              className="h-11 w-full min-w-0 border-0! bg-transparent text-xs text-[var(--forever-ink,#161616)] outline-none! ring-0! shadow-none! placeholder:text-[#8a887b]"
              placeholder={
                section === "history"
                  ? "Buscar ação, pessoa ou responsável"
                  : section === "team"
                    ? "Buscar e-mail da equipe"
                    : section === "buffet" ? "Buscar nome, convite ou restrição" : "Buscar mesa, nome ou convite"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <AdminButton
              variant="ghost"
              className="flex-1 sm:flex-none"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void onRefresh()
                  .then(refresh)
                  .catch((e) => setError(e.message))
                  .finally(() => setBusy(false));
              }}
            >
              <RefreshCw size={16} className={busy ? "animate-spin" : ""} />
              Atualizar
            </AdminButton>
            {section === "tables" && <AdminButton className="flex-1 sm:flex-none" onClick={() => {setError("");void setTableModal({action:"new-table",table:null});}}><Plus size={16} />Criar mesa</AdminButton>}
            {section === "team" && <AdminButton className="flex-1 sm:flex-none" onClick={() => {setEmail("");setPassword("");setError("");void setTableModal({action:"grant-team-access",table:null});}}><Plus size={16} />Liberar acesso</AdminButton>}
          </div>
        </div>
            {section === "tables" && (
          <div className="space-y-6">
            <OperationsTable title="Mesas cadastradas" count={visibleTables.length} label="Lista de mesas" headers={["Mesa", "Capacidade", "Ocupação", "Disponíveis", "Ações"]} empty="Nenhuma mesa encontrada.">
              {visibleTables.map(table => {
                const count = confirmed.filter(row => row.guest.tableId === table.id).length;
                return <tr key={table.id} className="hover:bg-neutral-50/40">
                  <td className="px-5 text-sm font-medium uppercase text-neutral-900">{table.name}</td>
                  <td className="px-5 text-xs text-neutral-600">{table.capacity} lugares</td>
                  <td className="px-5"><div className="flex items-center gap-3"><span className="text-xs text-neutral-600">{count} de {table.capacity}</span><progress aria-label={"Ocupação de " + table.name} value={count} max={table.capacity} className="h-1.5 w-24 overflow-hidden rounded-full accent-[#722F37]" /></div></td>
                  <td className="px-5 text-xs text-neutral-600">{Math.max(0, table.capacity - count)} livres</td>
                  <td className="px-5 text-right"><div className="inline-flex gap-1">
                    <TooltipButton type="button" title="Editar mesa" aria-label={"Editar " + table.name} disabled={busy} className={iconAction} onClick={() => { setError(""); void setTableModal({ action: "edit-table", table: table.id }); }}><Pencil size={16} aria-hidden="true" /></TooltipButton>
                    <TooltipButton type="button" title={count > 0 ? "Remova os convidados da mesa antes de excluir" : "Excluir mesa"} aria-label={"Excluir " + table.name} disabled={busy || count > 0} className={iconAction} onClick={() => void save({ action: "delete-table", id: table.id })}><Trash2 size={16} aria-hidden="true" /></TooltipButton>
                  </div></td>
                </tr>;
              })}
            </OperationsTable>
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-sm font-medium text-neutral-800">Distribuição dos convidados</h2><div className="w-full sm:w-60"><WeddingSelect label="Filtrar mesa dos convidados" value={tableFilter} onValueChange={setTableFilter} options={[{value:"all",label:"Todas as mesas"},{value:"none",label:"Sem mesa"},...tables.map(table=>({value:table.id,label:table.name}))]} /></div></div>
            <OperationsTable title="Convidados confirmados" count={filtered.length} label="Distribuição dos convidados por mesa" headers={["Convidado", "Convite", "Mesa", "Lugar", "Ações"]} empty="Nenhum convidado confirmado encontrado com estes filtros.">
              {filtered.map(({ guest, invitation }) => <SeatRow key={guest.id} guest={guest} label={invitation.label} tables={tables} busy={busy} onSave={(tableId, seat) => save({ action: "assign", invitationId: invitation.id, guestId: guest.id, tableId, seat })} />)}
            </OperationsTable>
          </div>
        )}
        {section === "buffet" && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="w-full sm:w-64"><WeddingSelect label="Filtrar restrições alimentares" value={onlyRestrictions ? "restrictions" : "all"} onValueChange={value=>setOnlyRestrictions(value === "restrictions")} options={[{value:"restrictions",label:"Com restrições alimentares"},{value:"all",label:"Todos os confirmados"}]} /></div>
              {modules.tables && <div className="w-full sm:w-60"><WeddingSelect label="Filtrar mesa" value={tableFilter} onValueChange={setTableFilter} options={[{value:"all",label:"Todas as mesas"},{value:"none",label:"Sem mesa"},...tables.map(table=>({value:table.id,label:table.name}))]} /></div>}
            </div>
            <OperationsTable title="Convidados do buffet" count={buffet.length} label="Alimentação e restrições dos convidados confirmados" headers={["Convidado","Convite","Faixa etária",...(modules.tables ? ["Mesa","Lugar"] : []),"Restrições alimentares"]} empty={onlyRestrictions ? "Nenhum convidado com restrição alimentar encontrado com estes filtros." : "Nenhum convidado confirmado encontrado com estes filtros."}>
              {buffet.map(({guest,invitation,restriction})=><tr key={invitation.id+":"+guest.id} className="hover:bg-neutral-50/40">
                <td className="px-5 text-sm font-medium uppercase text-neutral-900">{guest.name}</td>
                <td className="px-5 text-xs uppercase text-neutral-500">{invitation.label}</td>
                <td className="px-5 text-xs text-neutral-600">{guest.child ? "Criança" : "Adulto"}</td>
                {modules.tables && <><td className="px-5 text-xs text-neutral-600">{tables.find(table=>table.id===guest.tableId)?.name ?? "Sem mesa"}</td><td className="px-5 text-xs text-neutral-500">{guest.seat || "—"}</td></>}
                <td className="px-5 text-xs text-neutral-600">{restriction?.trim() ? <span className="inline-flex items-center gap-2"><Utensils size={15} className="shrink-0 text-[#722F37]" aria-hidden="true" />{restriction}</span> : <span className="text-neutral-400">Nenhuma informada</span>}</td>
              </tr>)}
            </OperationsTable>
          </div>
        )}
        {section === "history" && (
          <OperationsTable title="Alterações registradas" count={visibleHistory.length} label="Histórico de alterações" headers={["Data e hora", "Ação", "Pessoa ou item", "Responsável", "Detalhes"]} empty={query ? "Nenhuma alteração encontrada para esta busca." : "As próximas alterações aparecerão aqui."}>
            {visibleHistory.map(entry => <tr key={entry.id} className="hover:bg-neutral-50/40">
              <td className="px-5 text-xs text-neutral-500"><time dateTime={entry.at}>{new Date(entry.at).toLocaleString("pt-BR")}</time></td>
              <td className="px-5 text-sm font-medium text-neutral-800">{entry.action}</td>
              <td className="px-5 text-xs uppercase text-neutral-700">{entry.target || "—"}</td>
              <td className="px-5 text-xs text-neutral-600">{entry.actor}</td>
              <td className="px-5 text-xs text-neutral-500">{entry.details || "—"}</td>
            </tr>)}
          </OperationsTable>
        )}
        {section === "team" && (
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-neutral-500">A equipe acessa somente o controle de chegada: nomes, mesas e registro ou cancelamento de chegadas. As pessoas entram pelo mesmo login do painel.</p>
            <div className="w-full sm:w-60"><WeddingSelect label="Filtrar acesso da equipe" value={statusFilter} onValueChange={value => setStatusFilter(value === "active" || value === "revoked" ? value : "all")} options={[{value:"all",label:"Todos os acessos"},{value:"active",label:"Acessos ativos"},{value:"revoked",label:"Acessos revogados"}]} /></div>
            <OperationsTable title="Pessoas da equipe" count={visibleTeam.length} label="Equipe da recepção" headers={["E-mail", "Permissão", "Situação", "Ações"]} empty={query || statusFilter !== "all" ? "Nenhuma pessoa encontrada com estes filtros." : "Nenhuma pessoa na equipe. Use Liberar acesso para adicionar."}>
              {visibleTeam.map(member => <tr key={member.id} className="hover:bg-neutral-50/40">
                <td className="px-5 text-sm font-medium text-neutral-800">{member.email}</td>
                <td className="px-5 text-xs text-neutral-500">Recepção</td>
                <td className="px-5"><span className={`relative isolate inline-flex min-h-9 w-[200px] items-center justify-center overflow-hidden rounded-full px-4 py-2 text-xs font-medium ${member.active ? "bg-emerald-50 text-emerald-800" : "bg-neutral-100 text-neutral-600"}`}>{member.active ? <Check size={46} className="pointer-events-none absolute -bottom-2 -right-1 -z-10 -rotate-12 opacity-[0.09]" aria-hidden="true" /> : <X size={46} className="pointer-events-none absolute -bottom-2 -right-1 -z-10 -rotate-12 opacity-[0.09]" aria-hidden="true" />}{member.active ? "Acesso ativo" : "Acesso revogado"}</span></td>
                <td className="px-5 text-right"><div className="inline-flex items-center gap-1">
                  <button type="button" disabled={busy} className={textAction} onClick={() => void save({ action:"team", email:member.email, active:!member.active })}>{member.active ? <X size={16} aria-hidden="true" /> : <Check size={16} aria-hidden="true" />}{member.active ? "Revogar acesso" : "Reativar acesso"}</button>
                  <TooltipButton type="button" title="Remover da equipe" aria-label={"Remover " + member.email + " da equipe"} disabled={busy} className={iconAction} onClick={() => void save({action:"remove-team",email:member.email})}><Trash2 size={16} aria-hidden="true" /></TooltipButton>
                </div></td>
              </tr>)}
            </OperationsTable>
          </div>
        )}
      </fieldset>
      <AdminDialog
        open={tableModalOpen || teamModalOpen}
        onClose={() => {
          setPassword("");
          closeTableModal();
        }}
        busy={busy}
        title={
          teamModalOpen
            ? "Liberar acesso"
            : editing
              ? "Editar mesa"
              : "Nova mesa"
        }
        description={
          teamModalOpen
            ? "Crie uma conta com acesso restrito ao controle de chegada."
            : "Defina o nome e a quantidade de lugares para organizar seus convidados."
        }
      >
        <p className="mt-5 text-xs text-[var(--forever-accent,#77736c)]">
          Todos os campos marcados com <span className="text-red-600">*</span>{" "}
          são obrigatórios.
        </p>
        {teamModalOpen ? (
          <form
            className="mt-5 grid gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (pending || busy) return;
              if (await save({ action: "create-team", email, password })) {
                setEmail("");
                setPassword("");
                closeTableModal();
              }
            }}
          >
            <label className="grid gap-2 text-sm text-[var(--forever-primary,#722F37)]">
              <span>
                E-mail da equipe <span className="text-red-600">*</span>
              </span>
              <input
                autoFocus
                disabled={busy || pending}
                required
                type="email"
                className={input}
                placeholder="recepcao@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--forever-primary,#722F37)]">
              <span>
                Senha <span className="text-red-600">*</span>
              </span>
              <input
                disabled={busy || pending}
                required
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                className={input}
                placeholder="No mínimo 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-2 flex justify-end gap-3">
              <AdminButton
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setPassword("");
                  closeTableModal();
                }}
              >
                Cancelar
              </AdminButton>
              <AdminButton type="submit" disabled={busy || pending}>
                <Check size={16} />
                {busy ? "Salvando…" : "Liberar acesso"}
              </AdminButton>
            </div>
          </form>
        ) : (
          <form
            className="mt-5 grid gap-5"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                pending ||
                (tableModal.action === "edit-table" &&
                  !tables.some((table) => table.id === editing))
              )
                return;
              if (
                await save({
                  action: "table",
                  ...(editing ? { id: editing } : {}),
                  name,
                  capacity,
                })
              ) {
                closeTableModal();
              }
            }}
          >
            <label className="grid gap-2 text-sm text-[var(--forever-primary,#722F37)]">
              <span>
                Nome da mesa <span className="text-red-600">*</span>
              </span>
              <input
                autoFocus
                disabled={busy}
                required
                minLength={2}
                maxLength={80}
                className={input}
                placeholder="Ex.: Mesa 01"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="grid gap-2 text-sm text-[var(--forever-primary,#722F37)]">
              <span>
                Quantidade de lugares <span className="text-red-600">*</span>
              </span>
              <input
                disabled={busy}
                required
                type="number"
                min={1}
                max={100}
                className={input}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mt-2 flex justify-end gap-3">
              <AdminButton
                variant="ghost"
                disabled={busy}
                onClick={closeTableModal}
              >
                Cancelar
              </AdminButton>
              <AdminButton
                type="submit"
                disabled={
                  busy ||
                  pending ||
                  (tableModal.action === "edit-table" &&
                    !tables.some((table) => table.id === editing))
                }
              >
                <Check size={16} />
                {busy
                  ? "Salvando…"
                  : editing
                    ? "Salvar alterações"
                    : "Criar mesa"}
              </AdminButton>
            </div>
          </form>
        )}
      </AdminDialog>
    </AdminContainer>
  );
}
function SeatRow({
  guest,
  label,
  tables,
  busy,
  onSave,
}: {
  guest: Guest;
  label: string;
  tables: EventTable[];
  busy: boolean;
  onSave: (table: string, seat: string) => Promise<boolean | undefined>;
}) {
  const [table, setTable] = useState(guest.tableId ?? ""),
    [seat, setSeat] = useState(guest.seat ?? "");
  useEffect(() => {
    setTable(guest.tableId ?? "");
    setSeat(guest.seat ?? "");
  }, [guest.tableId, guest.seat]);
  const formId = useId();
  const unchanged = table === (guest.tableId ?? "") && seat === (guest.seat ?? "");
  return <tr className="hover:bg-neutral-50/40">
    <td className="px-5 text-sm font-medium uppercase text-neutral-800">{guest.name}</td>
    <td className="px-5 text-xs uppercase text-neutral-500">{label}</td>
    <td className="px-5"><div className="w-52"><WeddingSelect label={"Mesa de " + guest.name} value={table || "none"} onValueChange={value => {setTable(value === "none" ? "" : value);setSeat("");}} options={[{value:"none",label:"Sem mesa"},...tables.map(item=>({value:item.id,label:item.name}))]} /></div></td>
    <td className="px-5"><input form={formId} aria-label={"Lugar de " + guest.name} disabled={busy || !table} maxLength={30} className="h-10 w-40 rounded-xl border border-neutral-200 bg-white px-3 text-xs outline-none focus:border-[#722F37] disabled:opacity-40" placeholder="Lugar (opcional)" value={seat} onChange={event=>setSeat(event.target.value)} /></td>
    <td className="px-5 text-right"><form id={formId} onSubmit={event=>{event.preventDefault();if(!busy&&!unchanged)void onSave(table,seat);}}><button type="submit" disabled={busy || unchanged} className={textAction}><Check size={16} aria-hidden="true" />Salvar</button></form></td>
  </tr>;
}

const iconAction = "inline-flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-neutral-500 transition-colors hover:text-neutral-900 disabled:opacity-40";
const textAction = "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 disabled:opacity-40";

function OperationsTable({ title, count, label, headers, children, empty }: { title: string; count: number; label: string; headers: string[]; children: ReactNode; empty: string }) {
  return <div className="guest-table-view overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
    <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4"><h2 className="text-sm font-medium text-neutral-800">{title}</h2><span className="text-xs text-neutral-500">{count} {count === 1 ? "registro" : "registros"}</span></div>
    <AdminTable label={label} header={headers.map((header,index)=><th key={header} scope="col" className={`px-5 py-3.5 ${index === headers.length-1 && header === "Ações" ? "text-right" : ""}`}>{header}</th>)}>
      {count ? children : <tr><td colSpan={headers.length} className="px-5 py-14 text-center text-sm text-neutral-500">{empty}</td></tr>}
    </AdminTable>
    <div className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500">{count} {count === 1 ? "registro exibido" : "registros exibidos"}</div>
  </div>;
}
