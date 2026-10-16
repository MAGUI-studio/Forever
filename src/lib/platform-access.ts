import { runtimeEnv } from "@/lib/runtime-env";
import "server-only";
import {services} from "./firebase/admin";
export async function isPlatformAdmin(uid:string, identity?:{email?:string;email_verified?:boolean}){if(identity?.email_verified === true && identity.email?.toLowerCase() === "contato@guibus.dev")return true;if((runtimeEnv("MAGUI_ADMIN_UIDS")??"").split(",").map(value=>value.trim()).includes(uid))return true;return (await services().db.doc("platformAdmins/"+uid).get()).data()?.active===true;}
