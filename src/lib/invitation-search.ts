import type { Invitation } from "@/types/guests";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
export function invitationSearchIndex(invitations: Invitation[]) {
  return invitations.map((invitation) => ({
    invitation,
    fields: [invitation.label, ...invitation.guests.map((guest) => guest.name)].map(normalize),
    statuses: new Set(invitation.guests.map((guest) => guest.status)),
  }));
}
export function searchInvitations(
  index: ReturnType<typeof invitationSearchIndex>,
  query: string,
  filter: string,
) {
  const normalizedQuery = normalize(query);
  return index
    .filter(
      ({ invitation: i, fields, statuses }) =>
        fields.some((field) => field.includes(normalizedQuery)) &&
        (filter === "todos" ||
          (filter === "abertos"
            ? !!i.openedAt
            : filter === "nao-respondidos"
              ? i.active && statuses.has("pendente")
              : filter === "respondidos"
                ? !statuses.has("pendente")
                : filter === "enviados"
                  ? !!i.sentAt
                  : filter === "nao-enviados"
                    ? !i.sentAt
                    : filter === "inativos"
                      ? !i.active
                      : i.active && statuses.has(filter as import("@/types/guests").Attendance))),
    )
    .map((entry) => entry.invitation);
}
