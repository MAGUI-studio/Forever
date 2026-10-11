import {failure, reply, requireAccess} from "@/lib/guest-server";
export async function GET(request:Request) {try {const {role}=await requireAccess(request);return reply({role});} catch(e){return failure(e);}}
