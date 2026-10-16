import fs from "node:fs";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";

if (fs.existsSync(".env")) process.loadEnvFile(".env");
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
function deterministicShortCode(seed) {
  const hash = createHash("sha256").update(seed).digest();
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[hash[i] % ALPHABET.length];
  }
  return code.slice(0, 3) + "-" + code.slice(3);
}

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});

try {
  const db = getFirestore(app);
  const weddingsSnap = await db.collection("weddings").get();
  for (const weddingDoc of weddingsSnap.docs) {
    const slug = weddingDoc.id;
    console.log(`Processing wedding: ${slug}...`);
    const invitesSnap = await db.collection(`weddings/${slug}/invitations`).get();
    for (const doc of invitesSnap.docs) {
      const data = doc.data();
      const code = data.code ?? deterministicShortCode(doc.id);
      const guestCodes = { ...(data.guestCodes ?? {}) };
      for (const g of data.guests ?? []) {
        if (!guestCodes[g.id]) {
          guestCodes[g.id] =
            data.kind === "individual" || (data.guests ?? []).length === 1
              ? code
              : deterministicShortCode(doc.id + ":" + g.id);
        }
      }

      await doc.ref.update({ code, guestCodes });

      await db.doc(`weddings/${slug}/codes/${code}`).set({
        invitationId: doc.id,
        createdAt: new Date().toISOString(),
      });

      for (const [guestId, gCode] of Object.entries(guestCodes)) {
        if (gCode !== code) {
          await db.doc(`weddings/${slug}/codes/${gCode}`).set({
            invitationId: doc.id,
            guestId,
            createdAt: new Date().toISOString(),
          });
        }
      }
      console.log(
        `  Updated invite ${doc.id} (${data.label}): main code=${code}, ${Object.keys(guestCodes).length} guests`,
      );
    }
  }
  console.log("Backfill complete!");
} finally {
  await deleteApp(app);
}
