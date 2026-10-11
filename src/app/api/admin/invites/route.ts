import { audit } from "@/lib/event-audit";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  body,
  failure,
  HttpError,
  inviteSchema,
  reply,
  requireAdmin,
  requireAccess,
  tokenId,
  personalToken,
} from "@/lib/guest-server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request);
    const snap = await db
      .collection("invitations")
      .orderBy("updatedAt", "desc")
      .get();
    return reply({
      invitations: snap.docs.map((d) => ({ sentAt: null, ...d.data(), id: d.id, personalTokens: Object.fromEntries((d.data().guests ?? []).map((g: {id: string}) => [g.id, personalToken(d.id, d.data().token, g.id)])) })),
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const db = await requireAdmin(request);
    const {email:actor} = await requireAccess(request);
    const data = inviteSchema.parse(await body(request));
    const token = randomBytes(24).toString("hex");
    const id = tokenId(token);
    await db.runTransaction(async t => {
      t.set(db.collection("invitations").doc(id), {
        ...data,
        token,
        revision: 1,
        updatedAt: new Date().toISOString(),
        respondedAt: null,
        sentAt: null,
        message: "",
        dietaryRestrictions: "",
      });
      audit(t,db,actor,"Convite criado",data.label,data.guests.map(g=>g.name).join(", "));
    });
    return reply({ success: true }, 201);
  } catch (e) {
    return failure(e);
  }
}
const updateSchema = z.object({
  id: z.string().regex(/^[a-f0-9]{64}$/),
  revision: z.number().int().positive(),
  invitation: inviteSchema,
});
export async function PATCH(request: Request) {
  try {
    const db = await requireAdmin(request);
    const {email:actor} = await requireAccess(request);
    const data = updateSchema.parse(await body(request));
    const ref = db.collection("invitations").doc(data.id);
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists) throw new HttpError(404, "Convite removido.");
      if (snap.data()?.revision !== data.revision)
        throw new HttpError(
          409,
          "O convite mudou. Atualize a lista antes de editar novamente.",
        );
      const previous = snap.data()!;
      for (const guest of data.invitation.guests) {
        const old = previous.guests.find((g: {id:string}) => g.id === guest.id);
        if ((guest.tableId ?? "") !== (old?.tableId ?? "") || (guest.seat ?? "") !== (old?.seat ?? "")) throw new HttpError(400,"Altere os lugares na página de mesas.");
      }
      audit(t,db,actor,"Convite atualizado",data.invitation.label,data.invitation.guests.map(g=>{const old=previous.guests.find((p:{id:string})=>p.id===g.id);return !old ? g.name+": adicionado" : [old.name!==g.name?old.name+" → "+g.name:"",old.status!==g.status?g.name+": "+old.status+" → "+g.status:"",old.checkedIn!==g.checkedIn?g.name+(g.checkedIn?": chegada registrada":": chegada desfeita"):""].filter(Boolean).join("; ");}).filter(Boolean).join("; "));
      t.update(ref, {
        ...data.invitation,
        revision: data.revision + 1,
        updatedAt: new Date().toISOString(),
      });
    });
    return reply({ success: true });
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const db = await requireAdmin(request);
    const {email:actor} = await requireAccess(request);
    const data = updateSchema
      .pick({ id: true, revision: true })
      .parse(await body(request));
    const ref = db.collection("invitations").doc(data.id);
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists || snap.data()?.revision !== data.revision)
        throw new HttpError(409, "O convite mudou. Atualize a lista.");
      audit(t,db,actor,"Convite excluído",snap.data()?.label ?? "Convite");
      t.delete(ref);
    });
    return reply({ success: true });
  } catch (e) {
    return failure(e);
  }
}
