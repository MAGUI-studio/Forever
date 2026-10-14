import {resolveModules,redactModuleData} from "@/config/modules";
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
  generateShortCode,
  deterministicShortCode,
} from "@/lib/guest-server";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const db = await requireAdmin(request,"guestList");
    const {wedding}=await requireAccess(request);
    const snap = await db
      .collection("invitations")
      .orderBy("updatedAt", "desc")
      .get();
    return reply(redactModuleData({
      invitations: snap.docs.map((d) => {
        const item = d.data();
        const code = item.code ?? deterministicShortCode(d.id);
        const guestCodes = item.guestCodes ?? {};
        const personalCodes = Object.fromEntries(
          (item.guests ?? []).map((g: {id: string}) => [
            g.id,
            guestCodes[g.id] ?? (item.kind === "individual" || (item.guests ?? []).length === 1 ? code : deterministicShortCode(d.id + ":" + g.id))
          ])
        );
        return {
          sentAt: null,
          ...item,
          id: d.id,
          code,
          personalCodes,
          personalTokens: Object.fromEntries((item.guests ?? []).map((g: {id: string}) => [g.id, personalToken(d.id, item.token, g.id)])),
        };
      }),
    },resolveModules(wedding.modules)));
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const db = await requireAdmin(request,"guestList");
    const {email:actor,wedding} = await requireAccess(request);
    const data = inviteSchema.parse(await body(request));
    if(!resolveModules(wedding.modules).checkIn&&data.guests.some(g=>g.checkedIn))throw new HttpError(403,"Este recurso não está disponível para este casamento.");
    if(data.guests.some(g=>g.tableId||g.seat))throw new HttpError(400,"Distribua os lugares na página de mesas.");
    const token = randomBytes(24).toString("hex");
    const id = tokenId(token);
    const code = generateShortCode();
    const guestCodes: Record<string, string> = {};
    for (const g of data.guests) {
      guestCodes[g.id] = data.kind === "individual" || data.guests.length === 1 ? code : generateShortCode();
    }
    await db.runTransaction(async t => {
      t.set(db.collection("invitations").doc(id), {
        ...data,
        token,
        code,
        guestCodes,
        revision: 1,
        updatedAt: new Date().toISOString(),
        respondedAt: null,
        sentAt: null,
        message: "",
        dietaryRestrictions: "",
      });
      t.set(db.collection("codes").doc(code), {
        invitationId: id,
        createdAt: new Date().toISOString(),
      });
      for (const [guestId, gCode] of Object.entries(guestCodes)) {
        if (gCode !== code) {
          t.set(db.collection("codes").doc(gCode), {
            invitationId: id,
            guestId,
            createdAt: new Date().toISOString(),
          });
        }
      }
      audit(t,db,actor,"Convite criado",data.label,data.guests.map(g=>g.name).join(", "));
    });
    return reply({ success: true, id, code }, 201);
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
    const db = await requireAdmin(request,"guestList");
    const {email:actor,wedding} = await requireAccess(request);
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
      if(!resolveModules(wedding.modules).checkIn&&data.invitation.guests.some(g=>g.checkedIn!==(previous.guests.find((old:{id:string})=>old.id===g.id)?.checkedIn??false)))throw new HttpError(403,"Este recurso não está disponível para este casamento.");
      for (const guest of data.invitation.guests) {
        const old = previous.guests.find((g: {id:string}) => g.id === guest.id);
        if ((guest.tableId ?? "") !== (old?.tableId ?? "") || (guest.seat ?? "") !== (old?.seat ?? "")) throw new HttpError(400,"Altere os lugares na página de mesas.");
      }
      const code = previous.code ?? generateShortCode();
      const guestCodes: Record<string, string> = { ...(previous.guestCodes ?? {}) };
      for (const guest of data.invitation.guests) {
        if (!guestCodes[guest.id]) {
          guestCodes[guest.id] = data.invitation.kind === "individual" || data.invitation.guests.length === 1 ? code : generateShortCode();
          t.set(db.collection("codes").doc(guestCodes[guest.id]), {
            invitationId: data.id,
            guestId: guestCodes[guest.id] === code ? undefined : guest.id,
            createdAt: new Date().toISOString(),
          });
        }
      }
      t.set(db.collection("codes").doc(code), {
        invitationId: data.id,
        createdAt: new Date().toISOString(),
      });
      audit(t,db,actor,"Convite atualizado",data.invitation.label,data.invitation.guests.map(g=>{const old=previous.guests.find((p:{id:string})=>p.id===g.id);return !old ? g.name+": adicionado" : [old.name!==g.name?old.name+" → "+g.name:"",old.status!==g.status?g.name+": "+old.status+" → "+g.status:"",old.checkedIn!==g.checkedIn?g.name+(g.checkedIn?": chegada registrada":": chegada desfeita"):""].filter(Boolean).join("; ");}).filter(Boolean).join("; "));
      t.update(ref, {
        ...data.invitation,
        code,
        guestCodes,
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
    const db = await requireAdmin(request,"guestList");
    const {email:actor,wedding} = await requireAccess(request);
    const data = updateSchema
      .pick({ id: true, revision: true })
      .parse(await body(request));
    const ref = db.collection("invitations").doc(data.id);
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists || snap.data()?.revision !== data.revision)
        throw new HttpError(409, "O convite mudou. Atualize a lista.");
      const current = snap.data()!;
      if (current.code) {
        t.delete(db.collection("codes").doc(current.code));
      }
      if (current.guestCodes) {
        for (const gCode of Object.values(current.guestCodes as Record<string, string>)) {
          t.delete(db.collection("codes").doc(gCode));
        }
      }
      audit(t,db,actor,"Convite excluído",snap.data()?.label ?? "Convite");
      t.delete(ref);
    });
    return reply({ success: true });
  } catch (e) {
    return failure(e);
  }
}
