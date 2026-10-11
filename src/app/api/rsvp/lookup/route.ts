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
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { token } = z
      .object({ token: tokenSchema })
      .parse(await body(request));
    const { db } = services();
    const [snap, settings] = await Promise.all([
      db.collection("invitations").doc(invitationDocumentId(token)).get(),
      db.doc("settings/rsvp").get(),
    ]);
    const data = snap.data();
    if (!data || !data.active)
      throw new HttpError(
        404,
        "Convite não encontrado. Confira o código ou fale com os noivos.",
      );
    const allowed = authorizedGuests(token, data as {token: string; guests: import('@/types/guests').Guest[]});
    const personal = token.includes('.');
    const notes = personal ? data.personalResponses?.[allowed[0].id] : data;
    const config = settings.data() ?? { enabled: true, deadline: "" };
    return reply({
      invitation: {
        label: personal ? allowed[0].name : data.label,
        personal,
        guests: allowed.map(
          (g: { id: string; name: string; status: string }) => ({
            id: g.id,
            name: g.name,
            status: g.status,
            message: data.personalResponses?.[g.id]?.message ?? (allowed.length === 1 && !personal ? data.message : "") ?? "",
            dietaryRestrictions: data.personalResponses?.[g.id]?.dietaryRestrictions ?? (allowed.length === 1 && !personal ? data.dietaryRestrictions : "") ?? "",
          }),
        ),
        revision: data.revision,
        respondedAt: notes?.respondedAt ?? null,
        message: notes?.message ?? "",
        dietaryRestrictions: notes?.dietaryRestrictions ?? "",
      },
      settings: config,
    });
  } catch (e) {
    if (e instanceof z.ZodError) return reply({error:"Código de convite inválido. Copie o código completo enviado pelos noivos ou abra o link que você recebeu."},400);
    return failure(e);
  }
}
