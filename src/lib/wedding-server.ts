import "server-only";
import {cache} from "react";
import type { Firestore } from "firebase-admin/firestore";
import { services } from "./firebase/admin";
import { validWeddingSlug } from "@/config/forever";
import type { WeddingDocument } from "@/types/forever";
export type WeddingDatabase = Pick<
  Firestore,
  "collection" | "doc" | "runTransaction"
>;
export function scopedDatabase(db: Firestore, slug: string): WeddingDatabase {
  if (!validWeddingSlug(slug)) throw new Error("Invalid wedding scope");
  const prefix = "weddings/" + slug + "/";
  return {
    collection: ((path: string) =>
      db.collection(prefix + path)) as Firestore["collection"],
    doc: ((path: string) => db.doc(prefix + path)) as Firestore["doc"],
    runTransaction: db.runTransaction.bind(db),
  };
}
export const findWedding=cache(async(slug: string)=> {
  if (!validWeddingSlug(slug)) return null;
  const snap = await services()
    .db.doc("weddings/" + slug)
    .get();
  return snap.exists ? ({ ...snap.data(), slug } as WeddingDocument) : null;
});
