import { resolveModules, redactModuleData } from "@/config/modules";
import { assertModule } from "@/lib/guest-server";
import { z } from "zod";
import { publicWeddingAccess } from "@/lib/guest-server";
import {
  body,
  failure,
  HttpError,
  reply,
  sameOrigin,
  resolveInvitation,
  resolveAuthorizedGuests,
  checkLookupRateLimit,
  tokenSchema,
} from "@/lib/guest-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { token } = z.object({ token: tokenSchema }).parse(await body(request));
    const { wedding, db } = await publicWeddingAccess(request);
    assertModule(wedding, "rsvp");
    const modules = resolveModules(wedding.modules, wedding.plan);
    checkLookupRateLimit(request);
    const resolved = await resolveInvitation(db, token);
    const personal = Boolean(resolved.guestId) || token.includes(".");
    const [invitation, settings] = await Promise.all([
      db.runTransaction(async (t) => {
        const snap = await t.get(resolved.ref);
        const data = snap.data();
        if (!data || !data.active)
          throw new HttpError(
            404,
            "Convite não encontrado. Confira o código ou fale com os noivos.",
          );
        const allowed = resolveAuthorizedGuests(
          token,
          data as { token: string; guests: import("@/types/guests").Guest[] },
          resolved.guestId,
        );
        if (
          modules.invitationTracking &&
          (!data.openedAt || (personal && !data.personalOpenedAt?.[allowed[0].id]))
        ) {
          const now = new Date().toISOString();
          t.update(resolved.ref, {
            openedAt: data.openedAt ?? now,
            ...(personal
              ? {
                  personalOpenedAt: {
                    ...(data.personalOpenedAt ?? {}),
                    [allowed[0].id]: data.personalOpenedAt?.[allowed[0].id] ?? now,
                  },
                }
              : {}),
          });
        }
        return { data, allowed };
      }),
      db.doc("settings/rsvp").get(),
    ]);
    const { data, allowed } = invitation;
    const notes = personal ? data.personalResponses?.[allowed[0].id] : data;
    const config = settings.data() ?? { enabled: true, deadline: "" };
    return reply(
      redactModuleData(
        {
          invitation: {
            label: personal ? allowed[0].name : data.label,
            personal,
            guests: allowed.map((g: { id: string; name: string; status: string }) => ({
              id: g.id,
              name: g.name,
              status: g.status,
              message:
                data.personalResponses?.[g.id]?.message ??
                (allowed.length === 1 && !personal ? data.message : "") ??
                "",
              dietaryRestrictions:
                data.personalResponses?.[g.id]?.dietaryRestrictions ??
                (allowed.length === 1 && !personal ? data.dietaryRestrictions : "") ??
                "",
            })),
            revision: data.revision,
            respondedAt: notes?.respondedAt ?? null,
            message: notes?.message ?? "",
            dietaryRestrictions: notes?.dietaryRestrictions ?? "",
          },
          settings: config,
        },
        modules,
      ),
    );
  } catch (e) {
    if (e instanceof z.ZodError)
      return reply(
        {
          error:
            "Código de convite inválido. Copie o código completo enviado pelos noivos ou abra o link que você recebeu.",
        },
        400,
      );
    return failure(e);
  }
}
