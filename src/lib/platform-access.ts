import "server-only";
import {readDocument} from "./firebase/rest-read";
export async function isPlatformAdmin(uid:string, identity?:{email?:string;email_verified?:boolean}){if(identity?.email_verified === true && identity.email?.toLowerCase() === "contato@guibus.dev")return true;if((process.env.MAGUI_ADMIN_UIDS??"").split(",").map(value=>value.trim()).includes(uid))return true;return (await readDocument("platformAdmins/"+uid))?.active===true;}
