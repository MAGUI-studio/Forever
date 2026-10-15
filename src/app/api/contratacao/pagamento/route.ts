import { platformIdentity } from "@/lib/platform-server";
import { services } from "@/lib/firebase/admin";
import { getStripe } from "@/lib/stripe";
import { failure, HttpError, reply } from "@/lib/guest-server";

export async function GET(request:Request) {
  try {
    const {identity}=await platformIdentity(request);
    const id=new URL(request.url).searchParams.get("session_id");
    if(!id || !/^cs_[a-zA-Z0-9_]+$/.test(id))throw new HttpError(400,"Sessão de pagamento inválida.");
    const session=await getStripe().checkout.sessions.retrieve(id);
    const metadata=session.metadata;
    if(metadata?.ownerUid !== identity.uid || metadata.action !== "new" || !metadata.weddingSlug)throw new HttpError(403,"Este pagamento não pertence à sua conta.");
    const {db}=services();
    const order=await db.doc(`orders/${id}`).get();
    const wedding=await db.doc(`weddings/${metadata.weddingSlug}`).get();
    const member=await db.doc(`weddings/${metadata.weddingSlug}/members/${identity.uid}`).get();
    if(!member.data()?.active || member.data()?.role !== "admin")throw new HttpError(403,"Você não tem acesso a este casamento.");
    return reply({confirmed:!!order.data()?.fulfilledAt && wedding.data()?.plan === metadata.plan,slug:metadata.weddingSlug,plan:metadata.plan,status:order.data()?.paymentStatus === "failed" ? "failed" : session.status,paymentStatus:session.payment_status});
  }catch(error){return failure(error);}
}
