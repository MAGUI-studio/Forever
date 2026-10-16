import fs from "node:fs";
import { cert, initializeApp, deleteApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
if (fs.existsSync(".env")) process.loadEnvFile(".env");
const email = process.argv.find((value) => value.startsWith("--email="))?.slice(8);
if (!email) throw Error("Use --email=operator@example.com");
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
try {
  const user = await getAuth(app).getUserByEmail(email);
  await getFirestore(app)
    .doc("platformAdmins/" + user.uid)
    .set({ email: user.email, active: true, updatedAt: new Date().toISOString() }, { merge: true });
  console.log("Platform administrator access granted.");
} finally {
  await deleteApp(app);
}
