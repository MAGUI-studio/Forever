import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  body,
  failure,
  HttpError,
  inviteSchema,
  reply,
  requireAdmin,
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
    const data = inviteSchema.parse(await body(request));
    const token = randomBytes(24).toString("hex");
    const id = tokenId(token);
    await db
      .collection("invitations")
      .doc(id)
      .create({
        ...data,
        token,
        revision: 1,
        updatedAt: new Date().toISOString(),
        respondedAt: null,
        sentAt: null,
        message: "",
        dietaryRestrictions: "",
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
    const data = updateSchema
      .pick({ id: true, revision: true })
      .parse(await body(request));
    const ref = db.collection("invitations").doc(data.id);
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      if (!snap.exists || snap.data()?.revision !== data.revision)
        throw new HttpError(409, "O convite mudou. Atualize a lista.");
      t.delete(ref);
    });
    return reply({ success: true });
  } catch (e) {
    return failure(e);
  }
}
