import type { Guest, Invitation } from "@/types/guests";

export function dashboardSummary(guests: Guest[], invitations: Invitation[]) {
  const totalGuests = guests.length;
  const confirmedGuests = guests.filter((g) => g.status === "confirmado");
  const pendingGuests = guests.filter((g) => g.status === "pendente");
  const declinedGuests = guests.filter((g) => g.status === "recusado");

  const confirmedPct =
    totalGuests > 0 ? Math.round((confirmedGuests.length / totalGuests) * 100) : 0;
  const pendingPct = totalGuests > 0 ? Math.round((pendingGuests.length / totalGuests) * 100) : 0;
  const declinedPct = totalGuests > 0 ? Math.round((declinedGuests.length / totalGuests) * 100) : 0;

  const activeInvitations = invitations.filter((i) => i.active);
  const totalInvites = activeInvitations.length;
  const sentInvites = activeInvitations.filter((i) => !!i.sentAt).length;
  const openedInvites = activeInvitations.filter((i) => !!i.openedAt).length;
  const sentPct = totalInvites > 0 ? Math.round((sentInvites / totalInvites) * 100) : 0;

  const guestMessages: { name: string; message: string }[] = [];
  const messageTexts = new Set<string>();
  activeInvitations.forEach((inv) => {
    const guestById = new Map<string, Guest>();
    for (const guest of inv.guests) {
      if (!guestById.has(guest.id)) guestById.set(guest.id, guest);
    }
    if (inv.personalResponses) {
      Object.entries(inv.personalResponses).forEach(([guestId, resp]) => {
        if (resp.message?.trim()) {
          const g = guestById.get(guestId);
          messageTexts.add(resp.message.trim());
          guestMessages.push({
            name: g ? g.name : inv.label,
            message: resp.message.trim(),
          });
        }
      });
    }
    if (inv.message?.trim()) {
      const alreadyAdded = messageTexts.has(inv.message.trim());
      if (!alreadyAdded) {
        messageTexts.add(inv.message.trim());
        guestMessages.push({
          name: inv.label,
          message: inv.message.trim(),
        });
      }
    }
  });

  const dietaryGuestIds = new Set<string>();
  let hasSharedDietary = false;
  for (const inv of activeInvitations) {
    if (inv.guests.length === 1 && inv.dietaryRestrictions?.trim()) hasSharedDietary = true;
    for (const [guestId, response] of Object.entries(inv.personalResponses ?? {})) {
      if (response.dietaryRestrictions?.trim()) dietaryGuestIds.add(guestId);
    }
  }
  const dietaryCount = hasSharedDietary
    ? guests.length
    : guests.filter((guest) => dietaryGuestIds.has(guest.id)).length;
  return {
    confirmedGuests,
    pendingGuests,
    declinedGuests,
    confirmedPct,
    pendingPct,
    declinedPct,
    totalInvites,
    sentInvites,
    openedInvites,
    sentPct,
    guestMessages,
    dietaryCount,
  };
}
