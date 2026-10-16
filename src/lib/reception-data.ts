import type { WeddingDatabase } from "./wedding-server";
import type { WeddingModules } from "@/config/modules";
import type { Invitation } from "@/types/guests";
export async function receptionData(db: WeddingDatabase, modules: WeddingModules) {
  const [list, tables] = await Promise.all([
    db
      .collection("invitations")
      .orderBy("updatedAt", "desc")
      .select("label", "kind", "active", "revision", "guests")
      .get(),
    modules.tables ? db.doc("settings/tables").get() : null,
  ]);
  return {
    tables: modules.tables ? (tables?.data()?.tables ?? []) : [],
    invitations: list.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Invitation)
      .filter((i) => i.active)
      .map((i) => ({
        id: i.id,
        label: i.label,
        kind: i.kind ?? (i.guests.length > 1 ? "group" : "individual"),
        active: true,
        revision: i.revision,
        guests: i.guests
          .filter((g) => g.status === "confirmado")
          .map(({ id, name, child, status, checkedIn, checkedInAt, tableId, seat }) => ({
            id,
            name,
            child,
            status,
            checkedIn,
            checkedInAt: checkedInAt ?? null,
            tableId: modules.tables ? (tableId ?? "") : "",
            seat: modules.tables ? (seat ?? "") : "",
          })),
      })),
  };
}
