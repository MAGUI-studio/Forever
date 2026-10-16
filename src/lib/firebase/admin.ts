import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { RestDatabase } from "./rest-database";
import { serviceAccountAccessToken } from "./access-token";
const databases = new Map<string, RestDatabase>();
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
      let cached: { access_token: string; expires_in: number } | undefined;
      let expiresAt = 0;
      credential.getAccessToken = async () => {
        if (!cached || Date.now() >= expiresAt) {
          cached = await serviceAccountAccessToken(clientEmail, privateKey);
          expiresAt = Date.now() + Math.max(0, cached.expires_in - 60) * 1000;
        }
        return { ...cached, expires_in: Math.max(1, Math.floor((expiresAt - Date.now()) / 1000)) };
      };
    }
    app = initializeApp({ credential, projectId }, "wedding-server");
  }
  let db = databases.get(app.name);
  if (!db) {
    const credential = app.options.credential!;
    db = new RestDatabase(projectId, () => credential.getAccessToken());
    databases.set(app.name, db);
  }
  return { auth: getAuth(app), db: db.asFirestore() };
}
