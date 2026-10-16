import { resolveModules, sectionModule } from "@/config/modules";
import { assertModule, type requireAccess } from "./guest-server";
import { adminInvitations } from "./admin-invitations";
import { receptionData } from "./reception-data";
export const panelSections = [
  "overview",
  "guests",
  "check-in",
  "tables",
  "buffet",
  "history",
  "team",
  "site",
] as const;
export type PanelSection = (typeof panelSections)[number];
export async function panelData(
  access: Awaited<ReturnType<typeof requireAccess>>,
  section: PanelSection,
  includeInvitations = false,
) {
  const { db, wedding, role } = access;
  const modules = resolveModules(wedding.modules, wedding.plan);
  if (sectionModule[section] && !modules[sectionModule[section]!]) return null;
  if (role === "reception") {
    assertModule(wedding, "checkIn");
    return {
      ...(await receptionData(db, modules)),
      team: [],
      history: [],
      settings: null,
      invitationsLoaded: true,
    };
  }
  if (section === "site") return null;
  const checkIn = section === "check-in";
  const needsInvitations =
    includeInvitations || ["overview", "guests", "tables", "buffet"].includes(section);
  const needsTables =
    modules.tables && ["overview", "guests", "tables", "buffet"].includes(section);
  const [list, tables, settings, team, history] = await Promise.all([
    checkIn
      ? receptionData(db, modules)
      : needsInvitations
        ? adminInvitations(
            db,
            modules,
            section === "guests" || includeInvitations
              ? "links"
              : section === "overview"
                ? "overview"
                : "operations",
          ).then((invitations) => ({ invitations, tables: [] }))
        : { invitations: [], tables: [] },
    needsTables ? db.doc("settings/tables").get() : null,
    modules.rsvp ? db.doc("settings/rsvp").get() : null,
    section === "team" && modules.team
      ? db.collection("receptionTeam").orderBy("email").get()
      : null,
    section === "history" && modules.history
      ? db.collection("auditLog").orderBy("at", "desc").limit(100).get()
      : null,
  ]);
  return {
    invitations: list.invitations,
    invitationsLoaded: checkIn || needsInvitations,
    tables: checkIn ? list.tables : (tables?.data()?.tables ?? []),
    settings: modules.rsvp ? (settings?.data() ?? { enabled: true, deadline: "" }) : null,
    team: team?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [],
    history: history?.docs.map((d) => ({ id: d.id, ...d.data() })) ?? [],
  };
}
