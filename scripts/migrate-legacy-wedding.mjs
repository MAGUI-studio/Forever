import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import {getAuth} from "firebase-admin/auth";
import ts from "typescript";
if (fs.existsSync(".env")) process.loadEnvFile(".env");
const slug =
  process.argv.find((value) => value.startsWith("--slug="))?.slice(7) ??
  "giovanna-e-edson";
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw Error("Invalid slug");
const apply = process.argv.includes("--apply");
const uids = (process.env.FIREBASE_ADMIN_UIDS ?? "")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
if (!uids.length)
  throw Error(
    "Set FIREBASE_ADMIN_UIDS to the existing wedding owners before migration.",
  );
const file = path.resolve("scripts/legacy-wedding-config.ts"),
  module = { exports: {} };
const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    esModuleInterop: true,
    resolveJsonModule: true,
  },
}).outputText;
vm.runInThisContext("(function(require,module,exports){" + code + "})")(
  createRequire(file),
  module,
  module.exports,
);
const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
});
const ownerEmail=process.argv.find(value=>value.startsWith("--owner-email="))?.slice(14);
if(ownerEmail){const owner=await getAuth(app).getUserByEmail(ownerEmail);if(!uids.includes(owner.uid))uids.push(owner.uid);}
const db = getFirestore(app),
  target = db.doc("weddings/" + slug);
const groups = ["invitations", "receptionTeam", "auditLog"];
const snapshots = await Promise.all(
  groups.map((name) => db.collection(name).get()),
);
const settings = await Promise.all(
  ["rsvp", "tables"].map((name) => db.doc("settings/" + name).get()),
);
const count =
  snapshots.reduce((n, s) => n + s.size, 0) +
  settings.filter((s) => s.exists).length +
  uids.length +
  1;
if (count > 480)
  throw Error(
    "Migration exceeds atomic write limit. Export and use a batched migration before proceeding.",
  );
console.log(
  JSON.stringify({
    mode: apply ? "apply" : "dry-run",
    slug,
    invites: snapshots[0].size,
    team: snapshots[1].size,
    history: snapshots[2].size,
    owners: uids.length,
    targetExists: (await target.get()).exists,
  }),
);
if (apply) {
  await db.runTransaction(async (t) => {
    if ((await t.get(target)).exists)
      throw Error("Destination exists. Nothing was overwritten.");
    const now = new Date().toISOString();
    t.set(target, {
      slug,
      status: "published",
      theme: "botanical",
      config: module.exports.weddingConfig,
      createdAt: now,
      updatedAt: now,
    });
    snapshots.forEach((snapshot, index) =>
      snapshot.docs.forEach((doc) =>
        t.set(target.collection(groups[index]).doc(doc.id), doc.data()),
      ),
    );
    settings.forEach((snapshot, index) => {
      if (snapshot.exists)
        t.set(
          target.collection("settings").doc(["rsvp", "tables"][index]),
          snapshot.data(),
        );
    });
    uids.forEach((uid) =>
      t.set(target.collection("members").doc(uid), {
        uid,
        role: "admin",
        active: true,
      }),
    );
  });
  console.log("Migration complete. Original collections were preserved.");
}
await app.delete();
