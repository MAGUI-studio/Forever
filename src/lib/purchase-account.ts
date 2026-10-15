import "server-only";
import { services } from "./firebase/admin";
import { HttpError, tokenId } from "./guest-server";
import type { WeddingDocument } from "@/types/forever";

export async function purchaseWedding(uid:string,email:string) {
  const {db}=services();
  const weddings=await db.collection("weddings").get();
  const owned: WeddingDocument[]=[];
  let reception=false;
  for(const document of weddings.docs) {
    const member=await document.ref.collection("members").doc(uid).get();
    if(member.data()?.active && member.data()?.role === "admin") owned.push({...document.data(),slug:document.id} as WeddingDocument);
    else if(email && (await document.ref.collection("receptionTeam").doc(tokenId(email.toLowerCase())).get()).data()?.active) reception=true;
  }
  if(owned.length>1)throw new HttpError(409,"Sua conta possui mais de um casamento. Solicite a correção do vínculo.");
  if(!owned.length && reception)throw new HttpError(403,"Contas da recepção não podem contratar um plano para este casamento.");
  return owned[0] ?? null;
}
