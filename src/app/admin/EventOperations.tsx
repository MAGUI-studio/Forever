"use client";
import { useEffect, useState } from "react";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { AdminDialog } from "./AdminDialog";
import {
  Armchair,
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
import { AdminStatCard } from "./AdminStatCard";
import { AdminPageHeading } from "./AdminPageHeading";
import {
  ExpandingIconButton,
  ExpandingIconButtonGroup,
} from "@/components/ui/ExpandingIconButton";
import { AdminContainer } from "./AdminContainer";
import { SectionDivider } from "@/components/ui/SectionDivider";
import { WeddingSelect } from "@/components/ui/WeddingSelect";
import { SkeletonBlock } from "./skeleton";
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
  "h-12 w-full rounded-[var(--wedding-radius)] border border-[#5d613c30] bg-[#fffdfa] px-4 text-sm text-[var(--forever-ink,#3D2501)] outline-none focus:border-[var(--forever-primary,#5D613C)] focus:ring-2 focus:ring-[#5d613c20]";

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

  const [query, setQuery] = useState(""),
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
  const [tableFilter, setTableFilter] = useState("all"),
    [onlyRestrictions, setOnlyRestrictions] = useState(true);
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
        guest.name + " " + invitation.label + " " + restriction,
      ).includes(normalize(query)) &&
      (tableFilter === "all" ||
        (tableFilter === "none"
          ? !guest.tableId
          : guest.tableId === tableFilter)),
  );
  const buffet = filtered.filter(
    (row) => !onlyRestrictions || row.restriction?.trim(),
  );
  const pending = loading || pageLoading;
  return (
    <AdminContainer variant="content">
      <AdminPageHeading
        eyebrow="Cada detalhe importa"
        title={titles[section]}
        description={descriptions[section]}
      />
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
          <label className="flex min-h-12 w-full items-center gap-3 rounded-[var(--wedding-radius)] border border-[#5d613c30] bg-[#fffdfa] px-3 text-[var(--forever-primary,#5D613C)] focus-within:ring-2 focus-within:ring-[#5d613c20] sm:w-[340px] sm:shrink-0">
            <Search size={19} className="shrink-0" aria-hidden="true" />
            <input
              aria-label="Buscar nesta página"
              className="h-12 w-full min-w-0 border-0! bg-transparent text-sm text-[var(--forever-ink,#3D2501)] outline-none! ring-0! shadow-none! placeholder:text-[#8a887b]"
              placeholder={
                section === "history"
                  ? "Buscar ação, pessoa ou responsável"
                  : section === "team"
                    ? "Buscar e-mail da equipe"
                    : "Buscar nome, família ou grupo"
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="flex items-center gap-3">
            <AdminButton
              variant="ghost"
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
            {section === "tables" && (
              <AdminButton
                onClick={() => {
                  setError("");
                  void setTableModal({ action: "new-table", table: null });
                }}
              >
                <Plus size={16} />
                Criar mesa
              </AdminButton>
            )}
            {section === "team" && (
              <AdminButton
                onClick={() => {
                  setEmail("");
                  setPassword("");
                  setError("");
                  void setTableModal({
                    action: "grant-team-access",
                    table: null,
                  });
                }}
              >
                <Plus size={16} />
                Liberar acesso
              </AdminButton>
            )}
          </div>
        </div>
        {section === "tables" && (
          <>
            <div className="mb-6 grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 sm:gap-4">
              {[
                { label: "Confirmados", value: confirmed.length, icon: Users },
                {
                  label: "Com mesa",
                  value: confirmed.filter((r) => r.guest.tableId).length,
                  icon: Armchair,
                },
                {
                  label: "Sem mesa",
                  value: confirmed.filter((r) => !r.guest.tableId).length,
                  icon: Users,
                },
              ].map((item, index) => (
                <AdminStatCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  icon={<item.icon strokeWidth={1.5} />}
                  primary={index === 0}
                  loading={pending}
                  caption="pessoas na nossa lista"
                />
              ))}
            </div>
            <div className="mb-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {pending
                ? [0, 1, 2].map((index) => <TableSkeleton key={index} />)
                : tables.map((table) => {
                    const count = confirmed.filter(
                      (r) => r.guest.tableId === table.id,
                    ).length;
                    return (
                      <article
                        key={table.id}
                        className="relative isolate overflow-hidden rounded-[var(--wedding-radius)] border border-[#5d613c20] bg-[#fffdfa] p-5"
                      >
                        <Armchair
                          size={110}
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-4 -bottom-4 -rotate-12 text-[var(--forever-primary,#5D613C)] opacity-10"
                        />
                        <div className="flex items-center justify-between">
                          <h2 className="font-serif text-2xl text-[var(--forever-ink,#3D2501)]">
                            {table.name}
                          </h2>
                          <ExpandingIconButtonGroup className="relative flex">
                            <ExpandingIconButton
                              icon={<Pencil size={17} />}
                              label="Editar"
                              aria-label={"Editar " + table.name}
                              onClick={() => {
                                setError("");
                                void setTableModal({
                                  action: "edit-table",
                                  table: table.id,
                                });
                              }}
                            />
                            <ExpandingIconButton
                              disabled={busy || count > 0}
                              icon={<Trash2 size={17} />}
                              label="Excluir"
                              aria-label={"Excluir " + table.name}
                              onClick={() =>
                                void save({
                                  action: "delete-table",
                                  id: table.id,
                                })
                              }
                            />
                          </ExpandingIconButtonGroup>
                        </div>
                        <p className="mt-3 text-xs text-[var(--forever-accent,#80654E)]">
                          {count} de {table.capacity} lugares ocupados
                        </p>
                        <progress
                          aria-label={"Ocupação de " + table.name}
                          value={count}
                          max={table.capacity}
                          className="relative mt-3 h-1.5 w-full overflow-hidden rounded-full border-0 bg-[#5d613c10] [&::-webkit-progress-bar]:bg-[#5d613c10] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[var(--forever-primary,#5D613C)] [&::-moz-progress-bar]:bg-[var(--forever-primary,#5D613C)]"
                        />
                      </article>
                    );
                  })}
            </div>
            <SectionDivider
              title="Distribuição dos convidados"
              count={filtered.length}
            />
            <div className="mt-4 space-y-3">
              {pending
                ? [0, 1, 2].map((index) => <SeatSkeleton key={index} />)
                : filtered.map(({ guest, invitation }) => (
                    <SeatRow
                      key={guest.id}
                      guest={guest}
                      label={invitation.label}
                      tables={tables}
                      busy={busy}
                      onSave={(tableId, seat) =>
                        save({
                          action: "assign",
                          invitationId: invitation.id,
                          guestId: guest.id,
                          tableId,
                          seat,
                        })
                      }
                    />
                  ))}
            </div>
            {!pending && !filtered.length && (
              <Empty text="Os convidados confirmados aparecerão aqui para receber uma mesa." />
            )}
          </>
        )}
        {section === "buffet" && (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-[var(--forever-primary,#5D613C)]">
                {confirmed.length} confirmados ·{" "}
                {confirmed.filter((r) => r.restriction?.trim()).length} com
                restrições · {confirmed.filter((r) => r.guest.child).length}{" "}
                crianças
              </p>
            </div>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="sm:w-64">
                <WeddingSelect
                  label="Filtrar mesa"
                  value={tableFilter}
                  onValueChange={setTableFilter}
                  options={[
                    { value: "all", label: "Todas as mesas" },
                    { value: "none", label: "Sem mesa" },
                    ...tables.map((t) => ({ value: t.id, label: t.name })),
                  ]}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-[var(--forever-primary,#5D613C)]">
                <input
                  type="checkbox"
                  className="accent-[var(--forever-primary,#5D613C)]"
                  checked={onlyRestrictions}
                  onChange={(e) => setOnlyRestrictions(e.target.checked)}
                />
                Somente pessoas com restrições
              </label>
            </div>
            <div className="space-y-3">
              {pending
                ? [0, 1, 2].map((index) => <BuffetSkeleton key={index} />)
                : buffet.map(({ guest, invitation, restriction }) => (
                    <article
                      key={guest.id}
                      className="rounded-[var(--wedding-radius)] bg-[#fffdfa] p-5"
                    >
                      <div className="flex items-center gap-3">
                        <WarningCircleIcon
                          size={19}
                          weight="fill"
                          className="admin-dietary-alert shrink-0"
                          aria-hidden="true"
                        />
                        <h2 className="text-sm font-medium text-[var(--forever-ink,#3D2501)]">
                          {guest.name}
                          {guest.child ? " · Criança" : ""}
                        </h2>
                      </div>
                      <p className="mt-2 text-xs text-[var(--forever-accent,#80654E)]">
                        {invitation.label} ·{" "}
                        {tables.find((t) => t.id === guest.tableId)?.name ??
                          "Sem mesa"}
                        {guest.seat ? " · Lugar " + guest.seat : ""}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--forever-primary,#5D613C)]">
                        {restriction || "Nenhuma restrição informada."}
                      </p>
                    </article>
                  ))}
            </div>
            {!pending && !buffet.length && (
              <Empty text="Nenhuma restrição alimentar encontrada com esses filtros." />
            )}
          </>
        )}
        {section === "history" && (
          <>
            {pending ? (
              <ol className="divide-y divide-[#5d613c20]">
                {[0, 1, 2, 3].map((index) => (
                  <li key={index} className="flex gap-4 py-5">
                    <SkeletonBlock className="mt-1 size-8 shrink-0 rounded-full!" />
                    <div className="w-full">
                      <SkeletonBlock className="h-5 w-64 max-w-full" />
                      <SkeletonBlock className="mt-2 h-4 w-80 max-w-full" />
                      <SkeletonBlock className="mt-2 h-3 w-52 max-w-full" />
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <ol className="divide-y divide-[#5d613c20]">
                {history
                  .filter((e) =>
                    normalize(
                      e.action +
                        " " +
                        e.actor +
                        " " +
                        e.target +
                        " " +
                        e.details,
                    ).includes(normalize(query)),
                  )
                  .map((entry) => (
                    <li key={entry.id} className="flex gap-4 py-5">
                      <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#5d613c10] text-[var(--forever-primary,#5D613C)]">
                        <History size={15} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--forever-ink,#3D2501)]">
                          {entry.action} · {entry.target}
                        </p>
                        {entry.details && (
                          <p className="mt-2 whitespace-pre-wrap text-xs text-[var(--forever-primary,#5D613C)]">
                            {entry.details}
                          </p>
                        )}
                        <p className="mt-2 break-words text-[11px] text-[var(--forever-accent,#80654E)]">
                          {entry.actor} ·{" "}
                          {new Date(entry.at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </li>
                  ))}
              </ol>
            )}
            {!pending && !history.length && (
              <Empty text="As próximas alterações aparecerão aqui." />
            )}
          </>
        )}
        {section === "team" && (
          <>
            <div className="mb-6 rounded-[var(--wedding-radius)] bg-[#fffdfa] p-5 text-xs leading-relaxed text-[var(--forever-accent,#80654E)]">
              A equipe acessa somente o controle de chegada: nomes, mesas e
              registro ou cancelamento de chegadas. Cadastre o e-mail e a senha
              da pessoa aqui. Ela entra pelo mesmo login do painel.
            </div>
            {pending ? (
              <div className="space-y-3">
                {[0, 1].map((index) => (
                  <article
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-[var(--wedding-radius)] bg-[#fffdfa] p-5"
                  >
                    <div>
                      <SkeletonBlock className="h-5 w-52 max-w-full" />
                      <SkeletonBlock className="mt-1 h-4 w-32" />
                    </div>
                    <SkeletonBlock className="h-11 w-32" />
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {team
                  .filter((member) =>
                    normalize(member.email).includes(normalize(query)),
                  )
                  .map((member) => (
                    <article
                      key={member.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--wedding-radius)] bg-[#fffdfa] p-5"
                    >
                      <div>
                        <p className="break-all text-sm text-[var(--forever-ink,#3D2501)]">
                          {member.email}
                        </p>
                        <p className="mt-1 text-xs text-[var(--forever-accent,#80654E)]">
                          {member.active
                            ? "Acesso ativo · Recepção"
                            : "Acesso revogado"}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <AdminButton
                          variant="ghost"
                          disabled={busy}
                          onClick={() =>
                            void save({
                              action: "remove-team",
                              email: member.email,
                            })
                          }
                        >
                          <Trash2 size={16} />
                          Remover
                        </AdminButton>
                        <AdminButton
                          disabled={busy}
                          onClick={() =>
                            void save({
                              action: "team",
                              email: member.email,
                              active: !member.active,
                            })
                          }
                        >
                          {member.active ? (
                            <X size={16} />
                          ) : (
                            <Check size={16} />
                          )}
                          {member.active ? "Revogar acesso" : "Reativar acesso"}
                        </AdminButton>
                      </div>
                    </article>
                  ))}
              </div>
            )}
          </>
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
        <p className="mt-5 text-xs text-[var(--forever-accent,#80654E)]">
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
            <label className="grid gap-2 text-sm text-[var(--forever-primary,#5D613C)]">
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
            <label className="grid gap-2 text-sm text-[var(--forever-primary,#5D613C)]">
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
            <label className="grid gap-2 text-sm text-[var(--forever-primary,#5D613C)]">
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
            <label className="grid gap-2 text-sm text-[var(--forever-primary,#5D613C)]">
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
function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-[var(--wedding-radius)] bg-[#fffdfa] px-6 py-10 text-center text-sm text-[var(--forever-accent,#80654E)]">
      {text}
    </p>
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
  return (
    <form
      className="grid items-center gap-3 rounded-[var(--wedding-radius)] bg-[#fffdfa] p-4 sm:grid-cols-[minmax(0,1fr)_200px_120px_auto]"
      onSubmit={(e) => {
        e.preventDefault();
        void onSave(table, seat);
      }}
    >
      <div>
        <p className="text-sm text-[var(--forever-ink,#3D2501)]">
          {guest.name}
        </p>
        <p className="mt-1 text-[11px] text-[var(--forever-accent,#80654E)]">
          {label}
        </p>
      </div>
      <WeddingSelect
        label={"Mesa de " + guest.name}
        value={table || "none"}
        onValueChange={(value) => {
          setTable(value === "none" ? "" : value);
          setSeat("");
        }}
        options={[
          { value: "none", label: "Sem mesa" },
          ...tables.map((t) => ({ value: t.id, label: t.name })),
        ]}
      />
      <input
        aria-label={"Lugar de " + guest.name}
        disabled={!table}
        maxLength={30}
        className={input}
        placeholder="Lugar (opcional)"
        value={seat}
        onChange={(e) => setSeat(e.target.value)}
      />
      <AdminButton
        type="submit"
        disabled={
          busy ||
          (table === (guest.tableId ?? "") && seat === (guest.seat ?? ""))
        }
      >
        <Check size={16} />
        Salvar
      </AdminButton>
    </form>
  );
}

function TableSkeleton() {
  return (
    <article className="relative overflow-hidden rounded-[var(--wedding-radius)] border border-[#5d613c20] bg-[#fffdfa] p-5">
      <Armchair
        size={110}
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -bottom-4 -rotate-12 text-[var(--forever-primary,#5D613C)] opacity-10"
      />
      <div className="flex h-[42px] items-center justify-between">
        <SkeletonBlock className="h-7 w-28" />
        <SkeletonBlock className="h-[42px] w-20" />
      </div>
      <SkeletonBlock className="mt-3 h-4 w-40" />
      <SkeletonBlock className="mt-3 h-1.5 w-full" />
    </article>
  );
}
function SeatSkeleton() {
  return (
    <div className="grid items-center gap-3 rounded-[var(--wedding-radius)] bg-[#fffdfa] p-4 sm:grid-cols-[minmax(0,1fr)_200px_120px_auto]">
      <div>
        <SkeletonBlock className="h-5 w-28" />
        <SkeletonBlock className="mt-1 h-4 w-20" />
      </div>
      <SkeletonBlock className="h-12 w-full" />
      <SkeletonBlock className="h-12 w-full" />
      <SkeletonBlock className="h-11 w-24" />
    </div>
  );
}
function BuffetSkeleton() {
  return (
    <article className="rounded-[var(--wedding-radius)] bg-[#fffdfa] p-5">
      <SkeletonBlock className="h-5 w-40" />
      <SkeletonBlock className="mt-2 h-4 w-52 max-w-full" />
      <SkeletonBlock className="mt-3 h-5 w-80 max-w-full" />
    </article>
  );
}
