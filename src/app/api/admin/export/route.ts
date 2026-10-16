import { resolveModules, redactModuleData } from "@/config/modules";
import { requireAdminAccess, failure, reply } from "@/lib/guest-server";
export async function GET(request: Request) {
  try {
    const { db, wedding } = await requireAdminAccess(request),
      modules = resolveModules(wedding.modules, wedding.plan);
    const names = [
      "members",
      ...(modules.guestList ? ["invitations"] : []),
      ...(modules.team ? ["receptionTeam"] : []),
      ...(modules.history ? ["auditLog"] : []),
    ];
    const [collectionEntries, settingEntries] = await Promise.all([
      Promise.all(
        names.map(async (name) => [
          name,
          (await db.collection(name).get()).docs.map((d) => ({ id: d.id, ...d.data() })),
        ]),
      ),
      Promise.all(
        [...(modules.rsvp ? ["rsvp"] : []), ...(modules.tables ? ["tables"] : [])].map(
          async (key) => [key, (await db.doc("settings/" + key).get()).data() ?? null],
        ),
      ),
    ]);
    const collections = Object.fromEntries(collectionEntries);
    const settings = Object.fromEntries(settingEntries);
    return reply(
      redactModuleData(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          collections,
          settings,
        },
        modules,
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
