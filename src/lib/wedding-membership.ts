import "server-only";
import type {Transaction} from "firebase-admin/firestore";
import {services} from "./firebase/admin";
import {HttpError,tokenId} from "./guest-server";
export async function bindWeddingUser(transaction:Transaction,uid:string,email:string,slug:string){
 const db=services().db,ref=db.doc("userWeddingLinks/"+uid),link=await transaction.get(ref);
 if(link.exists&&link.data()?.slug!==slug)throw new HttpError(409,"Esta conta já está vinculada a outro casamento.");
 if(!link.exists){const weddings=await transaction.get(db.collection("weddings"));for(const wedding of weddings.docs){if(wedding.id===slug)continue;const member=await transaction.get(wedding.ref.collection("members").doc(uid));const team=await transaction.get(wedding.ref.collection("receptionTeam").doc(tokenId(email.toLowerCase())));if(member.data()?.active||team.exists)throw new HttpError(409,"Esta conta já está vinculada a outro casamento.");}}
 transaction.set(ref,{slug});
}
export async function releaseWeddingUser(transaction:Transaction,uid:string,slug:string){const ref=services().db.doc("userWeddingLinks/"+uid),link=await transaction.get(ref);if(link.data()?.slug===slug)transaction.delete(ref);}
