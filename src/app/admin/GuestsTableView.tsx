"use client";
import {
  useExpandedInvitations,
  useQueryState,
  kindParser,
  sortParser,
  orderParser,
  tableUrlOptions,
} from "./table-url-state";
import { GuestNames, GuestMessage } from "@/components/ui/GuestNames";
import { TooltipButton } from "@/components/ui/TooltipButton";
import { AdminTable, AdminTableDetails, shouldToggleTableRow } from "@/components/ui/AdminTable";
import { notify } from "@/components/ui/ForeverToaster";

import { useState, useMemo, useEffect } from "react";
import {
  CaretDownIcon,
  CheckIcon,
  CopyIcon,
  EnvelopeSimpleIcon,
  PaperPlaneTiltIcon,
  PencilSimpleIcon,
  TrashIcon,
  UsersIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  CircleCheck,
  CircleX,
  Clock3,
  CircleDashed,
} from "lucide-react";
import { invitationStatusScore } from "@/lib/invitation-sort";
import type { Invitation, Guest, EventTable } from "@/types/guests";

interface GuestsTableViewProps {
  invitations: Invitation[];
  allGuests: Guest[];
  tables: EventTable[];
  modules: {
    guestList?: boolean;
    rsvp?: boolean;
    tables?: boolean;
    invitationTracking?: boolean;
    dietaryRestrictions?: boolean;
    messages?: boolean;
    [key: string]: boolean | undefined;
  };
  busy: boolean;
  generatingPdf: string | null;
  copiedId: string | null;
  onEdit: (invite: Invitation) => void;
  onDelete: (inviteId: string) => void;
  onCopyLink: (token: string, key: string) => Promise<void>;
  onDownloadPdf: (invitation: { label: string; token: string }, key: string) => Promise<void>;
  onToggleSent: (invite: Invitation) => Promise<void>;
  onAddInvite: () => void;
  plan: "essencial" | "foreverPro";
}

type SortField = "label" | "guestsCount" | "status" | "sentAt";

export function GuestsTableView({
  invitations,
  tables,
  modules,
  busy,
  generatingPdf,
  copiedId,
  onEdit,
  onDelete,
  onCopyLink,
  onDownloadPdf,
  onToggleSent,
  onAddInvite,
  plan,
}: GuestsTableViewProps) {
  const [expandedRows, setExpandedRows] = useExpandedInvitations(
    invitations.map((invitation) => invitation.id),
  );
  const [tabFilter, setTabFilter] = useQueryState("kind", kindParser.withOptions(tableUrlOptions));
  const [sortField, setSortField] = useQueryState(
    "orderBy",
    sortParser.withOptions(tableUrlOptions),
  );
  const [sortDirection, setSortDirection] = useQueryState(
    "direction",
    orderParser.withOptions(tableUrlOptions),
  );

  const tableMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tables) {
      map.set(t.id, t.name);
    }
    return map;
  }, [tables]);

  const tabCounts = useMemo(() => {
    const groups = invitations.filter(
      (i) => i.kind === "group" || (!i.kind && i.guests.length > 1),
    ).length;
    const individuals = invitations.filter(
      (i) => i.kind === "individual" || (!i.kind && i.guests.length === 1),
    ).length;
    return {
      all: invitations.length,
      group: groups,
      individual: individuals,
    };
  }, [invitations]);

  const stats = useMemo(() => {
    const guests = invitations.flatMap((i) => (i.active ? i.guests : []));
    const confirmed = guests.filter((g) => g.status === "confirmado").length;
    return {
      totalGuests: guests.length,
      confirmed,
    };
  }, [invitations]);

  const filteredInvitations = useMemo(() => {
    return invitations.filter((i) => {
      if (tabFilter === "group") {
        return i.kind === "group" || (!i.kind && i.guests.length > 1);
      }
      if (tabFilter === "individual") {
        return i.kind === "individual" || (!i.kind && i.guests.length === 1);
      }
      return true;
    });
  }, [invitations, tabFilter]);

  const sortedInvitations = useMemo(() => {
    const statusScores = new Map<Invitation, number>();
    const sentTimes = new Map<Invitation, number>();
    for (const invitation of filteredInvitations) {
      if (sortField === "status") statusScores.set(invitation, invitationStatusScore(invitation));
      else if (sortField === "sentAt")
        sentTimes.set(invitation, invitation.sentAt ? new Date(invitation.sentAt).getTime() : 0);
    }
    return [...filteredInvitations].sort((a, b) => {
      let comparison = 0;
      if (sortField === "label") {
        comparison = a.label.localeCompare(b.label, "pt-BR");
      } else if (sortField === "guestsCount") {
        comparison = a.guests.length - b.guests.length;
      } else if (sortField === "sentAt") {
        comparison = sentTimes.get(a)! - sentTimes.get(b)!;
      } else if (sortField === "status") {
        comparison = statusScores.get(a)! - statusScores.get(b)!;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredInvitations, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const allExpanded = useMemo(() => {
    return sortedInvitations.length > 0 && sortedInvitations.every((i) => expandedRows[i.id]);
  }, [sortedInvitations, expandedRows]);

  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedRows({});
    } else {
      const all: Record<string, boolean> = {};
      for (const i of sortedInvitations) {
        all[i.id] = true;
      }
      setExpandedRows(all);
    }
  };

  return (
    <div className="guest-table-view space-y-4">
      <div className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
        <div className="flex flex-col gap-3 border-b border-neutral-100 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Tipo de convite">
            <button
              type="button"
              onClick={() => setTabFilter("all")}
              aria-pressed={tabFilter === "all"}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                tabFilter === "all"
                  ? "bg-[#722F37] text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80"
              }`}
            >
              <span>Todos</span>
              <span
                className={`text-[10px] ${tabFilter === "all" ? "opacity-80 text-white" : "text-neutral-400"}`}
              >
                ({tabCounts.all})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTabFilter("group")}
              aria-pressed={tabFilter === "group"}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                tabFilter === "group"
                  ? "bg-[#722F37] text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80"
              }`}
            >
              <span>Famílias e grupos</span>
              <span
                className={`text-[10px] ${tabFilter === "group" ? "opacity-80 text-white" : "text-neutral-400"}`}
              >
                ({tabCounts.group})
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTabFilter("individual")}
              aria-pressed={tabFilter === "individual"}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                tabFilter === "individual"
                  ? "bg-[#722F37] text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/80"
              }`}
            >
              <span>Individuais</span>
              <span
                className={`text-[10px] ${tabFilter === "individual" ? "opacity-80 text-white" : "text-neutral-400"}`}
              >
                ({tabCounts.individual})
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs text-neutral-500 sm:justify-end">
            <span className="text-xs text-neutral-400 font-normal">
              {filteredInvitations.length}{" "}
              {filteredInvitations.length === 1 ? "convite" : "convites"}
            </span>

            {sortedInvitations.length > 0 && (
              <>
                <span className="text-neutral-200">·</span>
                <button
                  type="button"
                  onClick={toggleExpandAll}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#722F37] hover:underline cursor-pointer"
                >
                  <CaretDownIcon
                    size={13}
                    className={`transition-transform duration-200 ${
                      allExpanded ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                  <span>{allExpanded ? "Recolher todos" : "Expandir todos"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        <p className="border-b border-neutral-100 bg-neutral-50/40 px-5 py-2.5 text-xs text-neutral-500">
          Selecione o nome do convite para ver os convidados, respostas e links pessoais.
        </p>

        <AdminTable
          label="Lista de convites e convidados"
          header={
            <>
              <th scope="col" className="w-9 px-3 py-3.5 text-center">
                <span className="sr-only">Expandir</span>
              </th>

              <th
                scope="col"
                aria-sort={
                  sortField === "label"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-5 py-3.5"
              >
                <button
                  type="button"
                  onClick={() => handleSort("label")}
                  className="inline-flex items-center gap-1 hover:text-[#161616] transition-colors cursor-pointer select-none"
                >
                  <span>Convite</span>
                  {sortField === "label" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp size={13} />
                    ) : (
                      <ArrowDown size={13} />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="opacity-50" />
                  )}
                </button>
              </th>

              <th
                scope="col"
                aria-sort={
                  sortField === "guestsCount"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-5 py-3.5"
              >
                <button
                  type="button"
                  onClick={() => handleSort("guestsCount")}
                  className="inline-flex items-center gap-1 hover:text-[#161616] transition-colors cursor-pointer select-none"
                >
                  <span>Convidados</span>
                  {sortField === "guestsCount" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp size={13} />
                    ) : (
                      <ArrowDown size={13} />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="opacity-50" />
                  )}
                </button>
              </th>

              <th
                scope="col"
                aria-sort={
                  sortField === "status"
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : "none"
                }
                className="px-5 py-3.5"
              >
                <button
                  type="button"
                  onClick={() => handleSort("status")}
                  className="inline-flex items-center gap-1 hover:text-[#161616] transition-colors cursor-pointer select-none"
                >
                  <span>Situação</span>
                  {sortField === "status" ? (
                    sortDirection === "asc" ? (
                      <ArrowUp size={13} />
                    ) : (
                      <ArrowDown size={13} />
                    )
                  ) : (
                    <ArrowUpDown size={12} className="opacity-50" />
                  )}
                </button>
              </th>

              {modules.tables && (
                <th scope="col" className="px-5 py-3.5">
                  <span>Mesa</span>
                </th>
              )}

              {modules.invitationTracking && (
                <th
                  scope="col"
                  aria-sort={
                    sortField === "sentAt"
                      ? sortDirection === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                  className="px-5 py-3.5"
                >
                  <button
                    type="button"
                    onClick={() => handleSort("sentAt")}
                    className="inline-flex items-center gap-1 hover:text-[#161616] transition-colors cursor-pointer select-none"
                  >
                    <span>Envio</span>
                    {sortField === "sentAt" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp size={13} />
                      ) : (
                        <ArrowDown size={13} />
                      )
                    ) : (
                      <ArrowUpDown size={12} className="opacity-50" />
                    )}
                  </button>
                </th>
              )}

              <th scope="col" className="px-5 py-3.5 text-right pr-6">
                <span>Ações</span>
              </th>
            </>
          }
        >
          {sortedInvitations.length === 0 ? (
            <tr>
              <td
                colSpan={
                  modules.tables && modules.invitationTracking
                    ? 7
                    : modules.tables || modules.invitationTracking
                      ? 6
                      : 5
                }
                className="py-16 text-center text-neutral-400"
              >
                <div className="flex flex-col items-center justify-center gap-2.5">
                  <span className="flex size-12 items-center justify-center rounded-full bg-neutral-100 text-[#722F37]">
                    <UsersIcon size={24} />
                  </span>
                  <p className="text-sm text-neutral-800 font-medium">Nenhum convite encontrado.</p>
                  <p className="text-xs text-neutral-400 max-w-sm">
                    {tabFilter !== "all"
                      ? "Não há convites correspondentes nesta categoria."
                      : "Tente mudar a busca ou ajuste os filtros acima."}
                  </p>
                  {tabFilter !== "all" ? (
                    <button
                      type="button"
                      onClick={() => setTabFilter("all")}
                      className="mt-2 text-xs font-medium text-[#722F37] hover:underline cursor-pointer"
                    >
                      Ver todos os convites
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onAddInvite}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#722F37] hover:underline cursor-pointer"
                    >
                      + Adicionar primeiro convite
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            sortedInvitations.map((invite) => {
              const isExpanded = !!expandedRows[invite.id];
              const isGroup = invite.kind === "group" || (!invite.kind && invite.guests.length > 1);

              const confirmedCount = invite.guests.filter((g) => g.status === "confirmado").length;
              const pendingCount = invite.guests.filter((g) => g.status === "pendente").length;
              const rejectedCount = invite.guests.filter((g) => g.status === "recusado").length;
              const totalCount = invite.guests.length;

              const guestTables = invite.guests
                .map((g) => (g.tableId ? tableMap.get(g.tableId) : null))
                .filter((t): t is string => Boolean(t));
              const uniqueTables = Array.from(new Set(guestTables));

              return (
                <RowFragment key={invite.id}>
                  <tr
                    data-invitation-expanded={isExpanded}
                    onClick={(event) => {
                      if (!shouldToggleTableRow(event.target)) return;
                      toggleRow(invite.id);
                    }}
                    className={`cursor-pointer transition-colors duration-200 ${
                      !invite.active
                        ? "opacity-50"
                        : isExpanded
                          ? "bg-white"
                          : "hover:bg-neutral-50/40"
                    }`}
                  >
                    <td className="px-3 py-4 text-center align-middle">
                      <button
                        type="button"
                        onClick={() => toggleRow(invite.id)}
                        aria-label={
                          isExpanded ? `Recolher ${invite.label}` : `Expandir ${invite.label}`
                        }
                        aria-expanded={isExpanded}
                        aria-controls={`invite-details-${invite.id}`}
                        className="inline-flex size-9 items-center justify-center text-neutral-400 hover:text-[#722F37] hover:bg-neutral-100 rounded-md transition-colors cursor-pointer"
                      >
                        <CaretDownIcon
                          size={14}
                          className={`transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-[#722F37]" : ""
                          }`}
                        />
                      </button>
                    </td>

                    <td className="px-5 py-4 align-middle">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => toggleRow(invite.id)}
                          aria-expanded={isExpanded}
                          aria-controls={`invite-details-${invite.id}`}
                          className="text-left font-sans text-sm font-medium uppercase text-[#161616] hover:text-[#722F37] transition-colors cursor-pointer leading-tight"
                        >
                          {invite.label}
                        </button>
                        <span className="text-xs text-neutral-500 mt-1.5">
                          {isGroup
                            ? `Família ou grupo · ${invite.guests.length} pessoas`
                            : "Convite individual"}
                          {!invite.active && " · Inativo"}
                          {invite.code && (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap">
                              <span> · #{invite.code}</span>
                              <CopyInvitationCode code={invite.code} />
                            </span>
                          )}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-middle text-xs text-neutral-700">
                      <GuestNames
                        guests={invite.guests}
                        renderMeta={(guest) => {
                          const response = invite.personalResponses?.[guest.id];
                          const message =
                            response?.message?.trim() ||
                            (invite.guests.length === 1 ? invite.message?.trim() : "");
                          const dietary =
                            response?.dietaryRestrictions?.trim() ||
                            (invite.guests.length === 1 ? invite.dietaryRestrictions?.trim() : "");
                          return (
                            <>
                              {modules.dietaryRestrictions && dietary && (
                                <TooltipButton
                                  type="button"
                                  title={dietary}
                                  aria-label={`Restrição alimentar de ${guest.name}`}
                                  className="inline-flex size-6 items-center justify-center rounded-md text-[#722F37] hover:bg-neutral-100"
                                >
                                  <WarningCircleIcon size={14} weight="fill" aria-hidden="true" />
                                </TooltipButton>
                              )}
                              {modules.messages && message && (
                                <GuestMessage name={guest.name} message={message} />
                              )}
                            </>
                          );
                        }}
                      />
                    </td>

                    <td className="px-5 py-4 align-middle whitespace-nowrap text-xs">
                      <InvitationStatusBadge
                        total={totalCount}
                        confirmed={confirmedCount}
                        rejected={rejectedCount}
                        pending={pendingCount}
                      />
                    </td>

                    {modules.tables && (
                      <td className="px-5 py-4 align-middle text-xs text-neutral-700">
                        {uniqueTables.length > 0 ? (
                          <span>{uniqueTables.join(", ")}</span>
                        ) : (
                          <span className="text-neutral-400">Sem mesa</span>
                        )}
                      </td>
                    )}

                    {modules.invitationTracking && (
                      <td className="px-5 py-4 align-middle text-xs text-neutral-500">
                        {invite.sentAt ? (
                          <span className="inline-flex flex-col gap-1">
                            <span className="text-neutral-700">Enviado</span>
                            <span className="text-[11px]">
                              {new Date(invite.sentAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </span>
                          </span>
                        ) : (
                          <span className="text-neutral-500">Não enviado</span>
                        )}
                      </td>
                    )}

                    <td className="px-5 py-4 align-middle text-right pr-6 whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <TooltipButton
                          type="button"
                          disabled={busy || !invite.active}
                          onClick={() => {
                            const token = invite.code ?? invite.token;
                            void onCopyLink(token, invite.id);
                          }}
                          title={
                            copiedId === invite.id
                              ? "Link copiado!"
                              : isGroup
                                ? "Copiar link do grupo"
                                : "Copiar link"
                          }
                          aria-label={
                            copiedId === invite.id
                              ? `Link copiado de ${invite.label}`
                              : `Copiar link de ${invite.label}`
                          }
                          className="inline-flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-neutral-500 transition-colors hover:text-neutral-900 cursor-pointer"
                        >
                          {copiedId === invite.id ? (
                            <CheckIcon size={16} weight="bold" />
                          ) : (
                            <CopyIcon size={16} />
                          )}
                        </TooltipButton>

                        <TooltipButton
                          type="button"
                          disabled={busy}
                          onClick={() => onEdit(invite)}
                          title="Editar convite"
                          aria-label={`Editar convite ${invite.label}`}
                          className="inline-flex size-9 items-center justify-center rounded-lg border-0 bg-transparent text-neutral-500 transition-colors hover:text-neutral-900 cursor-pointer"
                        >
                          <PencilSimpleIcon size={16} aria-hidden="true" />
                        </TooltipButton>
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger asChild>
                            <button
                              type="button"
                              disabled={busy}
                              aria-label={`Mais ações para ${invite.label}`}
                              className="inline-flex size-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                            >
                              <MoreHorizontal size={18} />
                            </button>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Portal>
                            <DropdownMenu.Content
                              align="end"
                              sideOffset={6}
                              className="z-50 min-w-52 rounded-xl border border-neutral-200 bg-white p-1.5 text-sm text-neutral-700 shadow-lg"
                            >
                              <DropdownMenu.Label className="px-3 py-2 text-xs text-neutral-500">
                                Ações do convite
                              </DropdownMenu.Label>
                              <DropdownMenu.Item
                                disabled={busy || !invite.active || generatingPdf === invite.id}
                                onSelect={() =>
                                  void onDownloadPdf(
                                    { label: invite.label, token: invite.code ?? invite.token },
                                    invite.id,
                                  )
                                }
                                className="guest-table-menu-item"
                              >
                                <EnvelopeSimpleIcon size={16} />
                                {generatingPdf === invite.id ? "Gerando PDF…" : "Baixar convite"}
                              </DropdownMenu.Item>
                              {modules.invitationTracking && (
                                <DropdownMenu.Item
                                  disabled={busy}
                                  onSelect={() => void onToggleSent(invite)}
                                  className="guest-table-menu-item"
                                >
                                  <PaperPlaneTiltIcon size={16} />
                                  {invite.sentAt
                                    ? "Marcar como não enviado"
                                    : "Marcar como enviado"}
                                </DropdownMenu.Item>
                              )}
                              <DropdownMenu.Separator className="my-1 h-px bg-neutral-100" />
                              <DropdownMenu.Item
                                disabled={busy}
                                onSelect={() => onDelete(invite.id)}
                                className="guest-table-menu-item text-rose-700"
                              >
                                <TrashIcon size={16} />
                                Excluir convite
                              </DropdownMenu.Item>
                            </DropdownMenu.Content>
                          </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                      </div>
                    </td>
                  </tr>

                  <AdminTableDetails
                    id={`invite-details-${invite.id}`}
                    expanded={isExpanded}
                    colSpan={5 + Number(!!modules.tables) + Number(!!modules.invitationTracking)}
                  >
                    <div className="invitation-people space-y-3 px-4 pb-4 pt-1 sm:px-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3 text-xs text-neutral-500">
                        {modules.invitationTracking && (
                          <span className="text-[11px] text-neutral-400">
                            {invite.openedAt
                              ? "Primeiro acesso: " +
                                new Date(invite.openedAt).toLocaleString("pt-BR")
                              : "Sem acesso registrado"}
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table
                          aria-label={`Pessoas do convite ${invite.label}`}
                          className="w-full border-collapse text-left"
                        >
                          <thead>
                            <tr className="border-b border-neutral-100 text-[10px] uppercase tracking-wider text-neutral-400">
                              <th scope="col" className="py-3 pr-6 font-medium">
                                Pessoa
                              </th>
                              <th scope="col" className="px-3 py-3 font-medium">
                                Situação
                              </th>
                              {modules.tables && (
                                <th scope="col" className="px-3 py-3 font-medium">
                                  Mesa e lugar
                                </th>
                              )}
                              <th scope="col" className="px-3 py-3 font-medium">
                                Observações
                              </th>
                              <th scope="col" className="py-3 pl-3 text-right font-medium">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100">
                            {invite.guests.map((g) => {
                              const guestToken =
                                invite.personalCodes?.[g.id] ??
                                invite.code ??
                                invite.personalTokens?.[g.id] ??
                                invite.token;
                              const guestDietary =
                                invite.personalResponses?.[g.id]?.dietaryRestrictions?.trim() ||
                                (invite.guests.length === 1 && invite.dietaryRestrictions?.trim());
                              const guestMessage =
                                invite.personalResponses?.[g.id]?.message?.trim() ||
                                (invite.guests.length === 1 && invite.message?.trim());
                              const tableAssignment = g.tableId ? tableMap.get(g.tableId) : null;

                              return (
                                <tr key={g.id} className="text-xs">
                                  <td className="whitespace-nowrap py-3.5 pr-6">
                                    <div className="flex items-center gap-2">
                                      {" "}
                                      <span className="font-sans text-sm font-medium uppercase text-neutral-800">
                                        {g.name}
                                      </span>
                                      {g.child && (
                                        <span className="text-[11px] text-neutral-400">
                                          (Criança)
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-3.5">
                                    <span
                                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                                        g.status === "confirmado"
                                          ? "bg-emerald-50 text-emerald-800"
                                          : g.status === "recusado"
                                            ? "bg-rose-50 text-rose-800"
                                            : "bg-neutral-100 text-neutral-700"
                                      }`}
                                    >
                                      {g.status === "confirmado"
                                        ? "Confirmado"
                                        : g.status === "recusado"
                                          ? "Não comparecerá"
                                          : "Pendente"}
                                    </span>
                                  </td>
                                  {modules.tables && (
                                    <td className="whitespace-nowrap px-3 py-3.5 text-neutral-600">
                                      {tableAssignment || "Sem mesa"}
                                      {g.seat ? ` (Lugar ${g.seat})` : ""}
                                    </td>
                                  )}
                                  <td className="whitespace-nowrap px-3 py-3.5">
                                    <div className="flex items-center gap-2">
                                      {" "}
                                      {modules.dietaryRestrictions && guestDietary && (
                                        <span className="flex items-center gap-1 text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full text-[11px]">
                                          <WarningCircleIcon size={13} weight="fill" />
                                          <span>{guestDietary}</span>
                                        </span>
                                      )}
                                      {modules.messages && guestMessage && (
                                        <GuestMessage name={g.name} message={guestMessage} />
                                      )}
                                    </div>
                                  </td>
                                  <td className="whitespace-nowrap py-3.5 pl-3">
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        type="button"
                                        disabled={busy || !invite.active}
                                        onClick={() => void onCopyLink(guestToken, g.id)}
                                        className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer"
                                      >
                                        {copiedId === g.id ? (
                                          <CheckIcon size={15} aria-hidden="true" />
                                        ) : (
                                          <CopyIcon size={15} aria-hidden="true" />
                                        )}
                                        {copiedId === g.id ? "Copiado!" : "Copiar link pessoal"}
                                      </button>

                                      <button
                                        type="button"
                                        disabled={busy || !invite.active || generatingPdf === g.id}
                                        onClick={() =>
                                          void onDownloadPdf(
                                            { label: g.name, token: guestToken },
                                            g.id,
                                          )
                                        }
                                        className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 cursor-pointer disabled:opacity-50"
                                      >
                                        <EnvelopeSimpleIcon size={15} aria-hidden="true" />
                                        {generatingPdf === g.id
                                          ? "Gerando convite…"
                                          : "Baixar convite"}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {(invite.message || invite.dietaryRestrictions || invite.respondedAt) && (
                        <div className="space-y-1.5 pt-2 text-xs text-neutral-500">
                          {modules.dietaryRestrictions && invite.dietaryRestrictions && (
                            <p className="text-neutral-800">
                              <strong className="text-neutral-700 font-medium">
                                Restrições do convite:
                              </strong>{" "}
                              {invite.dietaryRestrictions}
                            </p>
                          )}
                          {modules.messages && invite.message && invite.guests.length > 1 && (
                            <GuestMessage name={invite.label} message={invite.message} />
                          )}
                          {invite.respondedAt && (
                            <p className="text-[11px] text-neutral-400">
                              Última resposta:{" "}
                              {new Date(invite.respondedAt).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </AdminTableDetails>
                </RowFragment>
              );
            })
          )}
        </AdminTable>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 bg-white px-5 py-3 text-xs text-neutral-400">
          <span>
            {sortedInvitations.length}{" "}
            {sortedInvitations.length === 1 ? "convite exibido" : "convites exibidos"} ·{" "}
            {stats.totalGuests} convidados nesta seleção · {stats.confirmed} confirmados
          </span>
          <span className="hidden sm:inline">
            Forever {plan === "essencial" ? "Essencial" : "PRO"}
          </span>
        </div>
      </div>
    </div>
  );
}

function RowFragment({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function CopyInvitationCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const label = copied
    ? "Código copiado!"
    : failed
      ? "Não foi possível copiar. Tentar novamente"
      : "Copiar código";

  return (
    <TooltipButton
      type="button"
      title={label}
      aria-label={label}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          notify.success("Código copiado!", code);
          setFailed(false);
        } catch {
          setFailed(true);
          notify.error("Não foi possível copiar", "Tente copiar o código novamente.");
        }
      }}
      className={`inline-flex size-7 items-center justify-center rounded-md transition-colors cursor-pointer hover:bg-neutral-100 ${copied ? "text-emerald-700" : "text-neutral-500 hover:text-[#722F37]"}`}
    >
      {copied ? (
        <CheckIcon size={14} weight="bold" aria-hidden="true" />
      ) : (
        <CopyIcon size={14} aria-hidden="true" />
      )}
      <span className="sr-only" role="status">
        {copied ? "Código copiado!" : failed ? "Não foi possível copiar o código." : ""}
      </span>
    </TooltipButton>
  );
}

function InvitationStatusBadge({
  total,
  confirmed,
  rejected,
  pending,
}: {
  total: number;
  confirmed: number;
  rejected: number;
  pending: number;
}) {
  const count = total > 1 ? ` (${total})` : "";
  const status =
    total > 0 && confirmed === total
      ? { label: `Confirmado${count}`, Icon: CircleCheck, colors: "bg-emerald-50 text-emerald-800" }
      : total > 0 && rejected === total
        ? { label: `Não comparecerá${count}`, Icon: CircleX, colors: "bg-rose-50 text-rose-800" }
        : pending === total
          ? { label: `Pendente${count}`, Icon: Clock3, colors: "bg-neutral-100 text-neutral-700" }
          : {
              label: `${confirmed} de ${total} confirmados`,
              Icon: CircleDashed,
              colors: "bg-neutral-100 text-neutral-800",
            };
  return (
    <span
      className={`relative isolate inline-flex min-h-9 w-[200px] items-center justify-center overflow-hidden rounded-full px-4 py-2 text-center text-xs font-medium ${status.colors}`}
    >
      <status.Icon
        size={46}
        strokeWidth={1.5}
        className="pointer-events-none absolute -right-1 -bottom-2 -z-10 -rotate-12 opacity-[0.09]"
        aria-hidden="true"
      />
      <span className="relative whitespace-nowrap leading-5">{status.label}</span>
    </span>
  );
}
