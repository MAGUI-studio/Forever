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
  const sorted = [...ids].sort();
  for (const [prefix, open] of Object.entries(value)) {
    if (prefix === "all") continue;
    let low = 0,
      high = sorted.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (sorted[middle] < prefix) low = middle + 1;
      else high = middle;
    }
    const id = sorted[low];
    if (id?.startsWith(prefix) && !sorted[low + 1]?.startsWith(prefix)) result[id] = open;
  }
  return result;
}
export function compactExpanded(value: Record<string, boolean>, ids: string[]) {
  const open = ids.filter((id) => value[id]);
  if (!open.length) return {};
  const sorted = [...new Set(ids)].sort();
  const prefixes = new Map<string, string>();
  const sharedLength = (left: string, right = "") => {
    let length = 0;
    while (length < left.length && length < right.length && left[length] === right[length])
      length++;
    return length;
  };
  for (let index = 0; index < sorted.length; index++) {
    const id = sorted[index];
    const length = Math.max(
      6,
      sharedLength(id, sorted[index - 1]) + 1,
      sharedLength(id, sorted[index + 1]) + 1,
    );
    prefixes.set(id, id.slice(0, length));
  }
  const prefix = (id: string) => prefixes.get(id)!;
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
