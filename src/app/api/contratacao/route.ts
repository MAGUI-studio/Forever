import { templateExampleConfig } from "@/config/template-examples";
import { z } from "zod";
import { platformIdentity } from "@/lib/platform-server";
import { purchaseWedding } from "@/lib/purchase-account";
import { services } from "@/lib/firebase/admin";
import { bindWeddingUser } from "@/lib/wedding-membership";
import { body, failure, HttpError, reply } from "@/lib/guest-server";
import { emptyWeddingConfig, validWeddingSlug, normalizeWeddingPlan } from "@/config/forever";
import { isPlanExpired } from "@/config/plan-access";
import { weddingAddress } from "@/lib/wedding-address";

export async function GET(request:Request) {
  try {
    const {identity}=await platformIdentity(request);
    const wedding=await purchaseWedding(identity.uid,identity.email ?? "");
    const attempt=wedding ? (await services().db.doc(`weddings/${wedding.slug}`).get()).data()?.purchaseAttempt : null;
    const completed=attempt?.sessionId ? (await services().db.doc(`orders/${attempt.sessionId}`).get()).data()?.fulfilledAt : false;
    return reply({pendingPlan:!completed ? attempt?.plan ?? null : null,wedding:wedding ? {slug:wedding.slug,plan:normalizeWeddingPlan(wedding.plan),partner1:wedding.config.couple.partner1,partner2:wedding.config.couple.partner2,weddingDate:wedding.config.couple.weddingDate,status:wedding.status,expired:isPlanExpired(wedding)} : null});
  } catch(error){return failure(error);}
}
const schema=z.object({partner1:z.string().trim().min(1).max(80),partner2:z.string().trim().min(1).max(80),weddingDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),slug:z.string().trim().refine(validWeddingSlug).optional()}).strict();
export async function POST(request:Request) {
  try {
    const {identity}=await platformIdentity(request);
    if(!identity.email)throw new HttpError(400,"Cadastre um e-mail na sua conta.");
    const data=schema.parse(await body(request));
    const existing=await purchaseWedding(identity.uid,identity.email);
    if(existing)return reply({slug:existing.slug});
    const slug=data.slug ?? weddingAddress(data.partner1,data.partner2);
    if(!validWeddingSlug(slug))throw new HttpError(400,"Escolha um endereço com letras sem acentos, números e hífens.",undefined,"ADDRESS_INVALID");
    const date=new Date(data.weddingDate+"T12:00:00-03:00");
    if(Number.isNaN(date.getTime()) || date.toISOString().slice(0,10)!==data.weddingDate || isPlanExpired({plan:"essencial",config:{couple:{weddingDate:data.weddingDate}}}))throw new HttpError(400,"Informe uma data válida para o evento, a partir de hoje.");
    const {db}=services();
    const ref=db.doc("weddings/"+slug);
    await db.runTransaction(async transaction=>{
      if((await transaction.get(ref)).exists)throw new HttpError(409,"Este endereço já está em uso. Escolha outro para o casamento de vocês.",undefined,"ADDRESS_TAKEN");
      await bindWeddingUser(transaction,identity.uid,identity.email!,slug);
      const now=new Date().toISOString();
      transaction.set(ref,{slug,status:"draft",plan:null,theme:"botanical",templateId:"botanical-classic",purchaseOwnerUid:identity.uid,createdAt:now,updatedAt:now,config:templateExampleConfig({...emptyWeddingConfig,couple:{...emptyWeddingConfig.couple,partner1:data.partner1,partner2:data.partner2,weddingDate:data.weddingDate+"T12:00:00-03:00"}},"botanical-classic")});
      transaction.set(ref.collection("members").doc(identity.uid),{uid:identity.uid,email:identity.email,role:"admin",active:true});
      transaction.set(ref.collection("settings").doc("rsvp"),{enabled:true,deadline:""});
    });
    return reply({slug},201);
  } catch(error){return failure(error);}
}
