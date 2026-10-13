import { requireAdmin, failure, reply } from "@/lib/guest-server";
export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request);
    const names = ["invitations", "receptionTeam", "auditLog", "members"];
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
        ["rsvp", "tables"].map(async (key) => [
          key,
          (await db.doc("settings/" + key).get()).data() ?? null,
        ]),
      ),
    );
    return reply({
      version: 1,
      exportedAt: new Date().toISOString(),
      collections,
      settings,
    });
  } catch (e) {
    return failure(e);
  }
}
