import { audit } from "@/lib/event-audit";
import {
  body,
  failure,
  reply,
  requireAdmin,
  requireAccess,
  settingsSchema,
} from "@/lib/guest-server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request, "rsvp");
    const snap = await db.doc("settings/rsvp").get();
    return reply({ settings: snap.data() ?? { enabled: true, deadline: "" } });
  } catch (e) {
    return failure(e);
  }
}
export async function PUT(request: Request) {
  try {
    const db = await requireAdmin(request, "rsvp");
    const data = settingsSchema.parse(await body(request));
    const { email } = await requireAccess(request);
    await db.runTransaction(async (t) => {
      t.set(db.doc("settings/rsvp"), data);
      audit(
        t,
        db,
        email,
        "Configurações atualizadas",
        "Confirmações",
        data.enabled ? "Respostas abertas" : "Respostas encerradas",
      );
    });
    return reply({ success: true });
  } catch (e) {
    return failure(e);
  }
}
