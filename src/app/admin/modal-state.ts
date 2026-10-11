"use client";
import { createParser, parseAsStringEnum, useQueryStates } from "nuqs";
export const modalNames = [
  "new-invitation",
  "edit-invitation",
  "settings",
  "delete-invitation",
] as const;
export type AdminModalName = (typeof modalNames)[number];
const invitationId = createParser({
  parse: (value) => (/^[a-f0-9]{64}$/.test(value) ? value : null),
  serialize: (value) => value,
});
export function useAdminModal() {
  return useQueryStates(
    {
      modal: parseAsStringEnum<AdminModalName>([...modalNames]),
      convite: invitationId,
    },
    { history: "push", shallow: true, scroll: false, urlKeys: {modal: "action", convite: "invitation"} },
  );
}
