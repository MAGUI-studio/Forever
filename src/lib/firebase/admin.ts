import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { initializeFirestore } from "firebase-admin/firestore";
import { serviceAccountAccessToken } from "./access-token";
export function services() {
  let bindings: Record<string, unknown> = {};
  try {
    bindings = getCloudflareContext().env as unknown as Record<string, unknown>;
  } catch {
    // Local Next.js development has no Cloudflare request context.
  }
  const runtimeValue = (name: string) =>
    typeof bindings[name] === "string" ? bindings[name] as string : process.env[name];
  const projectId = runtimeValue("FIREBASE_PROJECT_ID");
  const clientEmail = runtimeValue("FIREBASE_CLIENT_EMAIL");
  const privateKey = runtimeValue("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey)
    throw new Error("Missing Firebase runtime variables: " + [
      !projectId && "FIREBASE_PROJECT_ID",
      !clientEmail && "FIREBASE_CLIENT_EMAIL",
      !privateKey && "FIREBASE_PRIVATE_KEY",
    ].filter(Boolean).join(", "));
  let app = getApps().find((a) => a.name === "wedding-server");
  if (!app) {
    const credential = cert({ projectId, clientEmail, privateKey });
    if (typeof bindings.FIREBASE_PROJECT_ID === "string") {
      credential.getAccessToken = () => serviceAccountAccessToken(clientEmail, privateKey);
    }
    app = initializeApp({ credential }, "wedding-server");
  }
  // Workers use HTTP transport; avoid loading the Node gRPC client.
  return { auth: getAuth(app), db: initializeFirestore(app, { preferRest: true }) };
}
