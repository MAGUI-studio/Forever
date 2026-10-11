import {services} from "@/lib/firebase/admin";
import {randomUUID} from "node:crypto";
import {z} from "zod";
import {body,failure,HttpError,reply,requireAdmin,requireAccess,tokenId} from "@/lib/guest-server";
import {audit} from "@/lib/event-audit";
import type {EventTable,Guest} from "@/types/guests";
export async function GET(request:Request){try{const db=await requireAdmin(request);const [tables,team,history]=await Promise.all([db.doc("settings/tables").get(),db.collection("receptionTeam").orderBy("email").get(),db.collection("auditLog").orderBy("at","desc").limit(100).get()]);return reply({tables:tables.data()?.tables??[],team:team.docs.map(d=>({id:d.id,...d.data()})),history:history.docs.map(d=>({id:d.id,...d.data()}))});}catch(e){return failure(e);}}
const schema=z.discriminatedUnion("action",[
 z.object({action:z.literal("table"),id:z.string().max(80).optional(),name:z.string().trim().min(2).max(80),capacity:z.number().int().min(1).max(100)}).strict(),
 z.object({action:z.literal("delete-table"),id:z.string().min(1).max(80)}).strict(),
 z.object({action:z.literal("assign"),invitationId:z.string().regex(/^[a-f0-9]{64}$/),guestId:z.string().uuid(),tableId:z.string().max(80),seat:z.string().trim().max(30)}).strict(),
 z.object({action:z.literal("create-team"),email:z.string().trim().email().max(254),password:z.string().min(8).max(128)}).strict(),
 z.object({action:z.literal("remove-team"),email:z.string().trim().email().max(254)}).strict(),
 z.object({action:z.literal("team"),email:z.string().trim().email().max(254),active:z.boolean()}).strict()
]);
export async function POST(request:Request){try{
 const db=await requireAdmin(request),{email:actor}=await requireAccess(request),data=schema.parse(await body(request));
 if(data.action==="create-team"){
  const email=data.email.toLowerCase(),auth=services().auth;
  let account;
  try{account=await auth.createUser({email,password:data.password});}
  catch(error){if((error as {code?:string}).code==="auth/email-already-exists")throw new HttpError(409,"Este e-mail já possui uma conta. Use outro e-mail ou reative o acesso existente.");throw error;}
  try{await db.runTransaction(async t=>{t.set(db.collection("receptionTeam").doc(tokenId(email)),{email,uid:account.uid,active:true});audit(t,db,actor,"Conta da recepção criada",email);});}
  catch(error){await auth.deleteUser(account.uid);throw error;}
  return reply({success:true});
 }
 await db.runTransaction(async t=>{
  if(data.action==="remove-team"){const email=data.email.toLowerCase();t.delete(db.collection("receptionTeam").doc(tokenId(email)));audit(t,db,actor,"Pessoa removida da recepção",email);return;}

  if(data.action==="team") {const email=data.email.toLowerCase();t.set(db.collection("receptionTeam").doc(tokenId(email)),{email,active:data.active},{merge:true});audit(t,db,actor,data.active?"Acesso à recepção concedido":"Acesso à recepção revogado",email);return;}
  const tablesRef=db.doc("settings/tables"),tableSnap=await t.get(tablesRef),tables=(tableSnap.data()?.tables??[]) as EventTable[];
  const invites=await t.get(db.collection("invitations"));
  const people=invites.docs.flatMap(d=>(d.data().guests as Guest[]).map(g=>({...g,invitationId:d.id,active:d.data().active})));
  if(data.action==="table"){
   const id=data.id??randomUUID();if(data.id && !tables.some(table=>table.id===id))throw new HttpError(404,"Mesa não encontrada.");
   if(tables.some(table=>table.id!==id && table.name.toLowerCase()===data.name.toLowerCase()))throw new HttpError(400,"Já existe uma mesa com esse nome.");
   if(people.filter(g=>g.active&&g.status==="confirmado"&&g.tableId===id).length>data.capacity)throw new HttpError(400,"A capacidade não pode ser menor que os lugares ocupados.");
   t.set(tablesRef,{tables:[...tables.filter(table=>table.id!==id),{id,name:data.name,capacity:data.capacity}]});audit(t,db,actor,data.id?"Mesa atualizada":"Mesa criada",data.name,"Capacidade: "+data.capacity);return;
  }
  if(data.action==="delete-table"){
   const table=tables.find(table=>table.id===data.id);if(!table)throw new HttpError(404,"Mesa não encontrada.");
   if(people.some(g=>g.tableId===data.id))throw new HttpError(400,"Remova as pessoas da mesa antes de excluí-la.");
   t.set(tablesRef,{tables:tables.filter(table=>table.id!==data.id)});audit(t,db,actor,"Mesa excluída",table.name);return;
  }
  const invite=invites.docs.find(d=>d.id===data.invitationId),current=invite?.data(),guests=(current?.guests??[]) as Guest[],guest=guests.find(g=>g.id===data.guestId);
  if(!guest || !current?.active || guest.status!=="confirmado")throw new HttpError(400,"Só convidados ativos e confirmados podem receber lugares.");
  const table=tables.find(table=>table.id===data.tableId);
  if(data.tableId&&!table)throw new HttpError(400,"Mesa não encontrada.");
  if(table){const others=people.filter(g=>g.id!==guest.id&&g.active&&g.status==="confirmado"&&g.tableId===table.id);
   if(others.length>=table.capacity)throw new HttpError(409,"Esta mesa está completa.");
   if(data.seat&&others.some(g=>g.seat?.toLowerCase()===data.seat.toLowerCase()))throw new HttpError(409,"Este lugar já está ocupado.");
  }
  const now=new Date().toISOString();t.update(db.collection("invitations").doc(data.invitationId),{guests:guests.map(g=>g.id===guest.id?{...g,tableId:data.tableId,seat:data.tableId?data.seat:""}:g),revision:current.revision+1,updatedAt:now});
  audit(t,db,actor,"Lugar atualizado",guest.name,(table?.name??"Sem mesa")+(data.seat?" · Lugar "+data.seat:""));
 });return reply({success:true});
 }catch(e){return failure(e);}}
