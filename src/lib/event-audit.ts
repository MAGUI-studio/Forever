import "server-only";
import { randomUUID } from "node:crypto";
import type {Firestore, Transaction} from "firebase-admin/firestore";
export function audit(transaction:Transaction, db:Firestore, actor:string, action:string, target:string, details = "") {
  transaction.set(db.collection("auditLog").doc(randomUUID()), {at:new Date().toISOString(), actor, action, target, details});
}
