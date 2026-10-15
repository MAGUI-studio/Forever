import {assertModule} from "@/lib/guest-server";
import {resolveModules} from "@/config/modules";
import {z} from "zod";
import {body,failure,HttpError,reply,requireAccess} from "@/lib/guest-server";
import {audit} from "@/lib/event-audit";
import type {Guest, Invitation} from "@/types/guests";
export async function GET(request:Request) {
 try {
  const {db,wedding}=await requireAccess(request);assertModule(wedding,"checkIn");const modules=resolveModules(wedding.modules, wedding.plan);
  const [list,tables]=await Promise.all([db.collection("invitations").orderBy("updatedAt","desc").get(),db.doc("settings/tables").get()]);
  return reply({tables:modules.tables?tables.data()?.tables ?? []:[], invitations:list.docs.map(d=>({id:d.id,...d.data()} as Invitation)).filter(i=>i.active).map(i=>({id:i.id,label:i.label,kind:i.kind ?? (i.guests.length>1 ? "group":"individual"),active:true,revision:i.revision,guests:i.guests.filter(g=>g.status === "confirmado").map(({id,name,child,status,checkedIn,checkedInAt,tableId,seat})=>({id,name,child,status,checkedIn,checkedInAt:checkedInAt ?? null,tableId:modules.tables?tableId ?? "":"",seat:modules.tables?seat ?? "":""}))}))});
 }catch(e){return failure(e);}
}
const schema=z.object({id:z.string().regex(/^[a-f0-9]{64}$/),guestIds:z.array(z.string().uuid()).min(1),checkedIn:z.boolean(),expectedCheckedIn:z.boolean()}).strict();
export async function PATCH(request:Request) {
 try {
  const {db,email,wedding}=await requireAccess(request);assertModule(wedding,"checkIn"); const data=schema.parse(await body(request));
  await db.runTransaction(async t=>{
   const ref=db.collection("invitations").doc(data.id),snap=await t.get(ref),current=snap.data();
   if(!current?.active) throw new HttpError(404,"Convite indisponível.");
   const guests=current.guests as Guest[], ids=new Set(data.guestIds);
   if(ids.size!==data.guestIds.length || data.guestIds.some(id=>!guests.some(g=>g.id===id && g.status==="confirmado"))) throw new HttpError(400,"Selecione apenas convidados confirmados deste convite.");
   if(guests.some(g=>ids.has(g.id) && g.checkedIn!==data.expectedCheckedIn)) throw new HttpError(409,"A chegada foi alterada por outra pessoa. Atualize a lista.");
   if(data.checkedIn===data.expectedCheckedIn) return;
   const now=new Date().toISOString();
   t.update(ref,{guests:guests.map(g=>ids.has(g.id)?{...g,checkedIn:data.checkedIn,checkedInAt:data.checkedIn?now:null}:g),revision:current.revision+1,updatedAt:now});
   audit(t,db,email,data.checkedIn?"Chegada registrada":"Chegada desfeita",current.label,guests.filter(g=>ids.has(g.id)).map(g=>g.name).join(", "));
  });return reply({success:true});
 }catch(e){return failure(e);}
}
