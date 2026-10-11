import {audit} from "@/lib/event-audit";
import { z } from "zod";
import { body, failure, HttpError, reply, requireAdmin, requireAccess } from "@/lib/guest-server";
export const runtime = "nodejs";
const schema = z.object({ id: z.string().regex(/^[a-f0-9]{64}$/), sent: z.boolean() }).strict();
export async function POST(request: Request) {
  try {
    const db = await requireAdmin(request); const {email:actor} = await requireAccess(request); const data = schema.parse(await body(request)); const ref = db.collection("invitations").doc(data.id);
    const sentAt = await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HttpError(404, "Convite removido. Atualize a lista.");
      const timestamp = data.sent ? snapshot.data()?.sentAt ?? new Date().toISOString() : null;
      // Delivery tracking is independent of attendance, so it does not invalidate an open RSVP form.
      if (snapshot.data()?.sentAt !== timestamp) audit(transaction,db,actor,data.sent?"Convite marcado como enviado":"Envio desmarcado",snapshot.data()?.label ?? "Convite");
      transaction.update(ref, { sentAt: timestamp }); return timestamp;
    });
    return reply({ success: true, sentAt });
  } catch (error) { return failure(error); }
}
