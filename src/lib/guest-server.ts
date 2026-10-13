import "server-only";
import {scopedDatabase,findWedding} from "./wedding-server";
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
export async function limitedBody(request:Request,limit=64000){
 const reader=request.body?.getReader();if(!reader)return new Uint8Array();const chunks:Uint8Array[]=[];let length=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>limit){await reader.cancel();throw new HttpError(413,"Dados muito extensos.");}chunks.push(value);}}finally{reader.releaseLock();}
 const result=new Uint8Array(length);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}
export async function body(request:Request){return JSON.parse(new TextDecoder().decode(await limitedBody(request)));}
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
  const wedding=await requestWedding(request);
  const scope=scopedDatabase(db,wedding.slug);
  if((process.env.MAGUI_ADMIN_UIDS??"").split(",").map(v=>v.trim()).includes(identity.uid))return {db:scope,uid:identity.uid,email:identity.email??"MAGUI.studio",role:"admin" as const,wedding};
  if(wedding.status==="suspended"||wedding.status==="archived")throw new HttpError(403,"Este casamento está suspenso ou arquivado.");
  const member=await db.doc("weddings/"+wedding.slug+"/members/"+identity.uid).get();
  if(member.data()?.active===true && member.data()?.role==="admin")return {db:scope,uid:identity.uid,email:identity.email??"Administrador",role:"admin" as const,wedding};
  const email=identity.email?.toLowerCase();
  if(email){const reception=await scope.collection("receptionTeam").doc(tokenId(email)).get();
    if(reception.data()?.active===true && (identity.email_verified||reception.data()?.uid===identity.uid))return {db:scope,uid:identity.uid,email,role:"reception" as const,wedding};
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

export async function requestWedding(request:Request,publicOnly=false){
 const slug=request.headers.get("x-wedding-slug")??"";
 const wedding=await findWedding(slug);
 if(!wedding || (publicOnly && wedding.status!=="published"))throw new HttpError(404,"Casamento indisponível.");
 return wedding;
}
export async function publicWeddingDatabase(request:Request){const wedding=await requestWedding(request,true);return scopedDatabase(services().db,wedding.slug);}
