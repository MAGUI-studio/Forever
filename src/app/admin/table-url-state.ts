"use client";

import {
  createParser,
  parseAsBoolean,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs";

export const tableUrlOptions = { shallow: true, scroll: false, history: "replace" } as const;
export const kindParser = parseAsStringLiteral(["all", "group", "individual"]).withDefault("all");
export const orderParser = parseAsStringLiteral(["asc", "desc"]).withDefault("asc");
export const guestFilterParser = parseAsStringLiteral([
  "todos",
  "confirmado",
  "pendente",
  "recusado",
  "abertos",
  "nao-respondidos",
  "respondidos",
  "enviados",
  "nao-enviados",
  "inativos",
]).withDefault("todos");
export const sortParser = parseAsStringLiteral([
  "label",
  "guestsCount",
  "status",
  "sentAt",
]).withDefault("label");

export const expandedParser = createParser<Record<string, boolean>>({
  parse: (value) =>
    Object.fromEntries(
      value
        .split(",")
        .filter((part) => part === "all" || /^!?[a-f0-9]{6,64}$/.test(part))
        .map((part) => [part.replace(/^!/, ""), !part.startsWith("!")]),
    ),
  serialize: (value) =>
    Object.keys(value)
      .sort((a, b) => (a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)))
      .map((id) => (value[id] ? id : `!${id}`))
      .join(","),
  eq: (a, b) =>
    JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort()),
}).withDefault({});

export function resolveExpanded(value: Record<string, boolean>, ids: string[]) {
  const result: Record<string, boolean> = {};
  if (value.all) for (const id of ids) result[id] = true;
  for (const [prefix, open] of Object.entries(value)) {
    if (prefix === "all") continue;
    const matches = ids.filter((id) => id.startsWith(prefix));
    if (matches.length === 1) result[matches[0]] = open;
  }
  return result;
}
export function compactExpanded(value: Record<string, boolean>, ids: string[]) {
  const prefix = (id: string) => {
    let length = 6;
    while (
      length < id.length &&
      ids.some((other) => other !== id && other.startsWith(id.slice(0, length)))
    )
      length++;
    return id.slice(0, length);
  };
  const open = ids.filter((id) => value[id]);
  if (!open.length) return {};
  const direct = Object.fromEntries(open.map((id) => [prefix(id), true]));
  const inverse = {
    all: true,
    ...Object.fromEntries(ids.filter((id) => !value[id]).map((id) => [prefix(id), false])),
  };
  return expandedParser.serialize(inverse).length < expandedParser.serialize(direct).length
    ? inverse
    : direct;
}
export function useTableSearch() {
  return useQueryState("q", parseAsString.withDefault("").withOptions(tableUrlOptions));
}
export function useExpandedInvitations(ids: string[]) {
  const [state, setState] = useQueryState("expanded", expandedParser.withOptions(tableUrlOptions));
  const expanded = resolveExpanded(state, ids);
  const setExpanded = (
    update:
      Record<string, boolean> | ((current: Record<string, boolean>) => Record<string, boolean>),
  ) =>
    setState((current) =>
      compactExpanded(
        typeof update === "function" ? update(resolveExpanded(current, ids)) : update,
        ids,
      ),
    );
  return [expanded, setExpanded] as const;
}
export { parseAsBoolean, parseAsString, parseAsStringLiteral, useQueryState };
