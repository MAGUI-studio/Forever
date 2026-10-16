import type { Invitation } from "@/types/guests";

export function invitationStatusScore(inv: Invitation) {
  const total = inv.guests.length;
  const conf = inv.guests.filter((g) => g.status === "confirmado").length;
  if (conf === total) return 3;
  if (conf > 0) return 2;
  const pend = inv.guests.filter((g) => g.status === "pendente").length;
  if (pend > 0) return 1;
  return 0;
}
