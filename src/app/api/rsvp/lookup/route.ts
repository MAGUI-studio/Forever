import {resolveModules,redactModuleData} from "@/config/modules";
import {requestWedding,assertModule} from "@/lib/guest-server";
import { z } from "zod";
import {publicWeddingDatabase} from "@/lib/guest-server";
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
    const { token } = z
      .object({ token: tokenSchema })
      .parse(await body(request));
    const wedding=await requestWedding(request,true);assertModule(wedding,"rsvp");const modules=resolveModules(wedding.modules);
    const db = await publicWeddingDatabase(request);
    checkLookupRateLimit(request);
    const resolved = await resolveInvitation(db, token);
    const [snap, settings] = await Promise.all([
      resolved.ref.get(),
      db.doc("settings/rsvp").get(),
    ]);
    const data = snap.data();
    if (!data || !data.active)
      throw new HttpError(
        404,
        "Convite não encontrado. Confira o código ou fale com os noivos.",
      );
    const allowed = resolveAuthorizedGuests(token, data as {token: string; guests: import('@/types/guests').Guest[]}, resolved.guestId);
    const personal = Boolean(resolved.guestId) || token.includes('.');
    const notes = personal ? data.personalResponses?.[allowed[0].id] : data;
    // Opening a valid link tracks access without invalidating an RSVP form.
    const invitationRef = resolved.ref;
    await db.runTransaction(async t => {
      const latest = await t.get(invitationRef), current = latest.data();
      if (!current?.active) throw new HttpError(404,"Convite não encontrado.");
      resolveAuthorizedGuests(token, current as {token:string; guests:import('@/types/guests').Guest[]}, resolved.guestId);
      const now = new Date().toISOString();
      if(modules.invitationTracking)t.update(invitationRef, {openedAt:current.openedAt ?? now, ...(personal ? {personalOpenedAt:{...(current.personalOpenedAt ?? {}),[allowed[0].id]:current.personalOpenedAt?.[allowed[0].id] ?? now}} : {})});
    });
    const config = settings.data() ?? { enabled: true, deadline: "" };
    return reply(redactModuleData({
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
    },modules));
  } catch (e) {
    if (e instanceof z.ZodError) return reply({error:"Código de convite inválido. Copie o código completo enviado pelos noivos ou abra o link que você recebeu."},400);
    return failure(e);
  }
}
