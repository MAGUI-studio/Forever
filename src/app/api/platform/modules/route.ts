import {z} from "zod";
import {platformIdentity} from "@/lib/platform-server";
import {services} from "@/lib/firebase/admin";
import {body,failure,HttpError,reply} from "@/lib/guest-server";
import {moduleKeys,resolveModules} from "@/config/modules";
import {slugSchema} from "@/lib/wedding-schema";
import {audit} from "@/lib/event-audit";
import {scopedDatabase} from "@/lib/wedding-server";
const schema=z.object({slug:slugSchema,modules:z.record(z.enum(moduleKeys),z.boolean()).refine(value=>moduleKeys.every(key=>typeof value[key]==="boolean"),"Informe todos os módulos.")}).strict();
export async function PUT(request:Request){try{const {identity,superadmin}=await platformIdentity(request);if(!superadmin)throw new HttpError(403,"Acesso exclusivo da MAGUI.studio.");const data=schema.parse(await body(request)),db=services().db,ref=db.doc("weddings/"+data.slug),modules=resolveModules(data.modules);await db.runTransaction(async t=>{const current=await t.get(ref);if(!current.exists)throw new HttpError(404,"Casamento não encontrado.");t.update(ref,{modules,updatedAt:new Date().toISOString()});audit(t,scopedDatabase(db,data.slug),identity.email??"MAGUI.studio","Módulos atualizados",data.slug,moduleKeys.filter(key=>resolveModules(current.data()?.modules)[key]!==modules[key]).map(key=>key+": "+modules[key]).join("; "));});return reply({modules});}catch(e){return failure(e);}}
