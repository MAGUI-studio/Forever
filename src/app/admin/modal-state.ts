"use client";
import { createParser, parseAsStringEnum, useQueryStates } from "nuqs";
export const modalNames = [
  "new-invitation",
  "edit-invitation",
  "settings",
  "delete-invitation",
] as const;
export type AdminModalName = (typeof modalNames)[number];
const actionParser = parseAsStringEnum([...modalNames, "new-table", "edit-table", "grant-team-access"]);
const invitationId = createParser({
  parse: (value) => (/^[a-f0-9]{64}$/.test(value) ? value : null),
  serialize: (value) => value,
});
export function useAdminModal() {
  const [state, setState] = useQueryStates(
    {
      modal: actionParser,
      convite: invitationId,
    },
    { history: "push", shallow: true, scroll: false, urlKeys: {modal: "action", convite: "invitation"} },
  );
  const modal = modalNames.includes(state.modal as AdminModalName) ? state.modal as AdminModalName : null;
  return [{...state, modal}, setState] as const;
}

export function useOperationsModal() {
  return useQueryStates(
    { action: actionParser, table: createParser({parse: value => /^[a-f0-9-]{36}$/.test(value) ? value : null, serialize: value => value}) },
    { history: "push", shallow: true, scroll: false },
  );
}
