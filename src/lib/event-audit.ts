import "server-only";
import { randomUUID } from "node:crypto";
import type {Transaction} from "firebase-admin/firestore";
import type {WeddingDatabase} from "./wedding-server";
export function audit(transaction:Transaction, db:WeddingDatabase, actor:string, action:string, target:string, details = "") {
  transaction.set(db.collection("auditLog").doc(randomUUID()), {at:new Date().toISOString(), actor, action, target, details});
}
