import "server-only";
import { services } from "./firebase/admin";
import { HttpError, tokenId } from "./guest-server";
import type { WeddingDocument } from "@/types/forever";
import { mapConcurrent } from "./map-concurrent";

export async function purchaseWedding(uid: string, email: string) {
  const { db } = services();
  const weddings = await db.collection("weddings").get();
  const matches = await mapConcurrent(weddings.docs, async (document) => {
    const member = await document.ref.collection("members").doc(uid).get();
    if (member.data()?.active && member.data()?.role === "admin")
      return {
        wedding: { ...document.data(), slug: document.id } as WeddingDocument,
        reception: false,
      };
    const reception = !!(
      email &&
      (
        await document.ref.collection("receptionTeam").doc(tokenId(email.toLowerCase())).get()
      ).data()?.active
    );
    return { wedding: null, reception };
  });
  const owned = matches.flatMap((match) => (match.wedding ? [match.wedding] : []));
  const reception = matches.some((match) => match.reception);
  if (owned.length > 1)
    throw new HttpError(
      409,
      "Sua conta possui mais de um casamento. Solicite a correção do vínculo.",
    );
  if (!owned.length && reception)
    throw new HttpError(
      403,
      "Contas da recepção não podem contratar um plano para este casamento.",
    );
  return owned[0] ?? null;
}
