import {audit} from "@/lib/event-audit";
import { z } from "zod";
import { services } from "@/lib/firebase/admin";
import {
  body,
  failure,
  HttpError,
  reply,
  sameOrigin,
  invitationDocumentId,
  authorizedGuests,
  tokenSchema,
} from "@/lib/guest-server";
import type { Guest } from "@/types/guests";
export const runtime = "nodejs";
const schema = z
  .object({
    token: tokenSchema,
    revision: z.number().int().positive(),
    responses: z
      .array(
        z
          .object({
            id: z.string().uuid(),
            status: z.enum(["confirmado", "recusado"]),
            message: z.string().trim().max(500).optional(),
            dietaryRestrictions: z.string().trim().max(500).optional(),
          })
          .strict(),
      )
      .min(1)
      .max(40),
    message: z.string().trim().max(500).optional(),
    dietaryRestrictions: z.string().trim().max(500).optional(),
  })
  .strict();
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const data = schema.parse(await body(request));
    const { db } = services();
    const ref = db.collection("invitations").doc(invitationDocumentId(data.token));
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const configSnap = await t.get(db.doc("settings/rsvp"));
      const config = configSnap.data();
      if (
        config?.enabled === false ||
        (config?.deadline && Date.now() > Date.parse(config.deadline))
      )
        throw new HttpError(
          403,
          "O período de confirmação está encerrado. Fale com os noivos.",
        );
      const current = snap.data();
      if (!current || !current.active)
        throw new HttpError(404, "Convite não encontrado. Fale com os noivos.");
      if (current.revision !== data.revision)
        throw new HttpError(
          409,
          "Este convite foi atualizado. Consulte o código novamente antes de responder.",
        );
      const guests = current.guests as Guest[];
      const allowed = authorizedGuests(data.token, current as {token: string; guests: Guest[]});
      const responses = new Map(data.responses.map((r) => [r.id, r.status]));
      if (
        responses.size !== allowed.length ||
        data.responses.length !== allowed.length ||
        allowed.some((g) => !responses.has(g.id))
      )
        throw new HttpError(
          400,
          "Responda apenas pelas pessoas do convite, sem repetir nomes.",
        );
      const now = new Date().toISOString();
      audit(t,db,"Convidado · "+(data.token.includes(".") ? allowed[0].name : current.label),"Resposta de presença",current.label,data.responses.map(r=>guests.find(g=>g.id===r.id)?.name+": "+r.status).join("; "));
      t.update(ref, {
        guests: guests.map((g) => responses.has(g.id) ? ({
          ...g,
          status: responses.get(g.id),
          checkedIn: responses.get(g.id) === "confirmado" && g.checkedIn,
        }) : g),
        revision: current.revision + 1,
        updatedAt: now,
        respondedAt: now,
        personalResponses: {
          ...(current.personalResponses ?? {}),
          ...Object.fromEntries(data.responses.map(r => [r.id, {
            message: r.message ?? (data.token.includes('.') ? data.message : undefined) ?? current.personalResponses?.[r.id]?.message ?? "",
            dietaryRestrictions: r.dietaryRestrictions ?? (data.token.includes('.') ? data.dietaryRestrictions : undefined) ?? current.personalResponses?.[r.id]?.dietaryRestrictions ?? "",
            respondedAt: now,
          }])),
        },
        ...(!data.token.includes('.') && data.message !== undefined ? {message: data.message} : {}),
        ...(!data.token.includes('.') && data.dietaryRestrictions !== undefined ? {dietaryRestrictions: data.dietaryRestrictions} : {}),
      });
    });
    return reply({ success: true, revision: data.revision + 1 });
  } catch (e) {
    return failure(e);
  }
}
