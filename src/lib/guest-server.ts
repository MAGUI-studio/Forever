import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { services } from "./firebase/admin";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function reply(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" },
  });
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return reply({ error: error.message }, error.status);
  if (error instanceof z.ZodError || error instanceof SyntaxError)
    return reply({ error: "Confira os dados informados." }, 400);
  return reply(
    { error: "Serviço indisponível. Tente novamente ou fale com os noivos." },
    503,
  );
}
export async function body(request: Request) {
  const text = await request.text();
  if (text.length > 64000) throw new HttpError(413, "Dados muito extensos.");
  return JSON.parse(text);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw new HttpError(403, "Origem não permitida.");
}
export async function requireAccess(request: Request) {
  sameOrigin(request);
  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!bearer) throw new HttpError(401, "Faça login para continuar.");
  const { auth, db } = services();
  let identity;
  try { identity = await auth.verifyIdToken(bearer, true); }
  catch { throw new HttpError(401, "Sua sessão expirou. Entre novamente."); }
  const admins = (process.env.FIREBASE_ADMIN_UIDS ?? "").split(",").map(s => s.trim());
  if (admins.includes(identity.uid)) return {db, uid:identity.uid, email:identity.email ?? "Administrador", role:"admin" as const};
  const email = identity.email?.toLowerCase();
  if (email) {
    const member = await db.collection("receptionTeam").doc(tokenId(email)).get();
    if (member.data()?.active === true && (identity.email_verified || member.data()?.uid === identity.uid)) return {db, uid:identity.uid, email, role:"reception" as const};
  }
  throw new HttpError(403, "Esta conta não tem acesso ao painel.");
}
export async function requireAdmin(request: Request) {
  const access = await requireAccess(request);
  if (access.role !== "admin") throw new HttpError(403, "Esta ação é exclusiva da administração.");
  return access.db;
}
export const tokenSchema = z.string().regex(/^(?:[a-f0-9]{48}|[a-f0-9]{64}\.[a-f0-9-]{36}\.[a-f0-9]{64})$/);
export const invitationDocumentId = (token: string) => token.includes('.') ? token.split('.')[0] : tokenId(token);
export function personalToken(id: string, secret: string, guestId: string) {
 const payload = id + '.' + guestId;
 return payload + '.' + createHmac('sha256', secret).update(payload).digest('hex');
}
export function authorizedGuests(token: string, invitation: {token: string; guests: import('@/types/guests').Guest[]}) {
 if (!token.includes('.')) return invitation.guests;
 const [id, guestId] = token.split('.');
 const expected = personalToken(id, invitation.token, guestId);
 if (token.length !== expected.length || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) throw new HttpError(404, 'Convite não encontrado.');
 const guests = invitation.guests.filter(g => g.id === guestId);
 if (!guests.length) throw new HttpError(404, 'Convite não encontrado.');
 return guests;
}
export const tokenId = (token: string) =>
  createHash("sha256").update(token).digest("hex");
export const guestSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(2).max(100),
    child: z.boolean(),
    status: z.enum(["pendente", "confirmado", "recusado"]),
    checkedIn: z.boolean(),
    tableId: z.string().max(80).optional(),
    seat: z.string().trim().max(30).optional(),
    checkedInAt: z.string().nullable().optional(),
  })
  .strict()
  .refine(
    (g) => !g.checkedIn || g.status === "confirmado",
    "Só convidados confirmados podem ter chegada registrada.",
  );
export const inviteSchema = z
  .object({
    kind: z.enum(["individual", "group"]).optional(),
    label: z.string().trim().max(100),
    active: z.boolean(),
    guests: z.array(guestSchema).min(1).max(40),
  })
  .strict()
  .refine(
    (i) => new Set(i.guests.map((g) => g.id)).size === i.guests.length,
    "Convidados duplicados.",
  ).refine(i => i.kind === 'individual' ? i.guests.length === 1 : i.label.length >= 2)
  .transform(i => ({...i, label: i.kind === 'individual' ? i.guests[0].name : i.label}));
export const settingsSchema = z
  .object({
    enabled: z.boolean(),
    deadline: z
      .string()
      .max(30)
      .refine(
        (s) =>
          s === "" ||
          (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s) &&
            Number.isFinite(Date.parse(s))),
      ),
  })
  .strict();
