import {resolveModules,redactModuleData} from "@/config/modules";
import {requireAccess} from "@/lib/guest-server";
import { requireAdmin, failure, reply } from "@/lib/guest-server";
export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request);
    const {wedding}=await requireAccess(request),modules=resolveModules(wedding.modules, wedding.plan);
    const names = ["members",...(modules.guestList?["invitations"]:[]),...(modules.team?["receptionTeam"]:[]),...(modules.history?["auditLog"]:[])];
    const collections = Object.fromEntries(
      await Promise.all(
        names.map(async (name) => [
          name,
          (await db.collection(name).get()).docs.map((d) => ({
            id: d.id,
            ...d.data(),
          })),
        ]),
      ),
    );
    const settings = Object.fromEntries(
      await Promise.all(
        [...(modules.rsvp?["rsvp"]:[]),...(modules.tables?["tables"]:[])].map(async (key) => [
          key,
          (await db.doc("settings/" + key).get()).data() ?? null,
        ]),
      ),
    );
    return reply(redactModuleData({
      version: 1,
      exportedAt: new Date().toISOString(),
      collections,
      settings,
    },modules));
  } catch (e) {
    return failure(e);
  }
}
