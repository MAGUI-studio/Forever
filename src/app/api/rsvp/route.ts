import { resolveModules, redactModuleData } from "@/config/modules";
import { requestWedding, assertModule } from "@/lib/guest-server";
import { audit } from "@/lib/event-audit";
import { z } from "zod";
import { publicWeddingDatabase } from "@/lib/guest-server";
import {
  body,
  failure,
  HttpError,
  reply,
  sameOrigin,
  resolveInvitation,
  resolveAuthorizedGuests,
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
      .min(1),
    message: z.string().trim().max(500).optional(),
    dietaryRestrictions: z.string().trim().max(500).optional(),
  })
  .strict();
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const data = schema.parse(await body(request));
    const wedding = await requestWedding(request, true);
    assertModule(wedding, "rsvp");
    const modules = resolveModules(wedding.modules, wedding.plan);
    const db = await publicWeddingDatabase(request);
    if (
      !modules.dietaryRestrictions &&
      (data.dietaryRestrictions?.trim() ||
        data.responses.some((r) => r.dietaryRestrictions?.trim()))
    )
      throw new HttpError(403, "Este recurso não está disponível para este casamento.");
    if (
      !modules.messages &&
      (data.message?.trim() || data.responses.some((r) => r.message?.trim()))
    )
      throw new HttpError(403, "Este recurso não está disponível para este casamento.");
    const resolved = await resolveInvitation(db, data.token);
    const ref = resolved.ref;
    await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const configSnap = await t.get(db.doc("settings/rsvp"));
      const config = configSnap.data();
      if (
        config?.enabled === false ||
        (config?.deadline && Date.now() > Date.parse(config.deadline))
      )
        throw new HttpError(403, "O período de confirmação está encerrado. Fale com os noivos.");
      const current = snap.data();
      if (!current || !current.active)
        throw new HttpError(404, "Convite não encontrado. Fale com os noivos.");
      if (current.revision !== data.revision)
        throw new HttpError(
          409,
          "Este convite foi atualizado. Consulte o código novamente antes de responder.",
        );
      const guests = current.guests as Guest[];
      const allowed = resolveAuthorizedGuests(
        data.token,
        current as { token: string; guests: Guest[] },
        resolved.guestId,
      );
      const isPersonal = Boolean(resolved.guestId) || data.token.includes(".");
      const responses = new Map(data.responses.map((r) => [r.id, r.status]));
      if (
        responses.size !== allowed.length ||
        data.responses.length !== allowed.length ||
        allowed.some((g) => !responses.has(g.id))
      )
        throw new HttpError(400, "Responda apenas pelas pessoas do convite, sem repetir nomes.");
      const now = new Date().toISOString();
      audit(
        t,
        db,
        "Convidado · " + (isPersonal ? allowed[0].name : current.label),
        "Resposta de presença",
        current.label,
        data.responses
          .map((r) => guests.find((g) => g.id === r.id)?.name + ": " + r.status)
          .join("; "),
      );
      t.update(ref, {
        guests: guests.map((g) =>
          responses.has(g.id)
            ? {
                ...g,
                status: responses.get(g.id),
                checkedIn: responses.get(g.id) === "confirmado" && g.checkedIn,
              }
            : g,
        ),
        revision: current.revision + 1,
        updatedAt: now,
        respondedAt: now,
        personalResponses: {
          ...(current.personalResponses ?? {}),
          ...Object.fromEntries(
            data.responses.map((r) => [
              r.id,
              {
                message: modules.messages
                  ? (r.message ??
                    (isPersonal ? data.message : undefined) ??
                    current.personalResponses?.[r.id]?.message ??
                    "")
                  : (current.personalResponses?.[r.id]?.message ?? ""),
                dietaryRestrictions: modules.dietaryRestrictions
                  ? (r.dietaryRestrictions ??
                    (isPersonal ? data.dietaryRestrictions : undefined) ??
                    current.personalResponses?.[r.id]?.dietaryRestrictions ??
                    "")
                  : (current.personalResponses?.[r.id]?.dietaryRestrictions ?? ""),
                respondedAt: now,
              },
            ]),
          ),
        },
        ...(modules.messages && !isPersonal && data.message !== undefined
          ? { message: data.message }
          : {}),
        ...(modules.dietaryRestrictions && !isPersonal && data.dietaryRestrictions !== undefined
          ? { dietaryRestrictions: data.dietaryRestrictions }
          : {}),
      });
    });
    return reply({ success: true, revision: data.revision + 1 });
  } catch (e) {
    return failure(e);
  }
}
