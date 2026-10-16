import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
const require = createRequire(import.meta.url);
function checkServerImports(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) { checkServerImports(path); continue; }
    if (!/\.tsx?$/.test(path)) continue;
    const source = ts.createSourceFile(path, fs.readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
    for (const statement of source.statements) {
      if (ts.isImportDeclaration(statement) && statement.moduleSpecifier.text === "firebase-admin/firestore") {
        assert(statement.importClause?.isTypeOnly, `Runtime Firestore SDK import reintroduces protobuf code generation: ${path}`);
      }
    }
  }
}
checkServerImports("src");
const documents = new Map();
const commits = [];
let abortNextCommit = false;
let rollbacks = 0;
const name = path => `projects/test/databases/(default)/documents/${path}`;
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
function setPath(target, path, value) {
  const keys = path.replaceAll("`", "").split(".");
  for (const key of keys.slice(0, -1)) { target[key] ??= { mapValue: { fields: {} } }; target = target[key].mapValue.fields; }
  target[keys.at(-1)] = structuredClone(value);
}
function getPath(target, path) {
  const keys = path.replaceAll("`", "").split(".");
  for (const key of keys.slice(0, -1)) target = target[key]?.mapValue.fields ?? {};
  return target[keys.at(-1)];
}
async function mockFetch(url, options) {
  assert.equal(options.headers.Authorization, "Bearer mock-token");
  const parsed = new URL(url);
  assert.equal(parsed.origin, "https://firestore.googleapis.com");
  const path = decodeURIComponent(parsed.pathname.split("/documents")[1]);
  const body = options.body ? JSON.parse(options.body) : null;
  if (path === ":beginTransaction") return json({ transaction: "transaction-token" });
  if (path === ":rollback") { rollbacks++; return json({}); }
  if (path === ":commit") {
    if (abortNextCommit && body.transaction) { abortNextCommit = false; return json({ error: { status: "ABORTED" } }, 409); }
    // Validate every precondition before applying any write.
    for (const write of body.writes) {
      if (write.currentDocument && documents.has(write.update.name) !== write.currentDocument.exists) return json({ error: { status: "FAILED_PRECONDITION" } }, 409);
    }
    commits.push(body);
    for (const write of body.writes) {
      if (write.delete) { documents.delete(write.delete); continue; }
      if (write.updateMask) {
        const fields = structuredClone(documents.get(write.update.name)?.fields ?? {});
        for (const field of write.updateMask.fieldPaths) setPath(fields, field, getPath(write.update.fields, field));
        documents.set(write.update.name, { name: write.update.name, fields });
      } else documents.set(write.update.name, structuredClone(write.update));
    }
    return json({ writeResults: [] });
  }
  if (path.endsWith(":runQuery")) {
    const parent = path.slice(1, -":runQuery".length);
    const prefix = name((parent ? parent + "/" : "") + body.structuredQuery.from[0].collectionId + "/");
    let rows = [...documents.values()].filter(doc => doc.name.startsWith(prefix) && !doc.name.slice(prefix.length).includes("/"));
    const filter = body.structuredQuery.where?.fieldFilter;
    if (filter) rows = rows.filter(doc => JSON.stringify(getPath(doc.fields, filter.field.fieldPath)) === JSON.stringify(filter.value));
    if (body.structuredQuery.limit !== undefined) rows = rows.slice(0, body.structuredQuery.limit);
    return json(rows.map(document => ({ document })));
  }
  return documents.has(name(path.slice(1))) ? json(documents.get(name(path.slice(1)))) : json({ error: { status: "NOT_FOUND" } }, 404);
}
function load(path, modules = {}) {
  const source = ts.transpileModule(fs.readFileSync(path, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true });
  assert.equal(source.diagnostics.length, 0);
  const exports = {};
  const context = vm.createContext({ exports, require: id => id === "server-only" ? {} : modules[id] ?? require(id), fetch: mockFetch, AbortSignal, URL, Date, console, structuredClone });
  new vm.Script(source.outputText).runInContext(context);
  // Match Workers' restriction during requests: no generated JavaScript.
  vm.runInContext('globalThis.Function = function() { throw new EvalError("Code generation blocked"); }', context);
  return exports;
}
const { RestDatabase } = load("src/lib/firebase/rest-database.ts");
const db = new RestDatabase("test", async () => ({ access_token: "mock-token" }));
await db.doc("weddings/couple").set({ plan: null, status: "draft", nested: { keep: true, change: 1 }, list: [1, "x", null] });
assert.equal((await db.doc("weddings/couple").get()).data().nested.keep, true);
assert.equal((await db.doc("weddings/missing").get()).exists, false);
await db.doc("weddings/couple").set({ nested: { change: 2 } }, { merge: true });
assert.equal((await db.doc("weddings/couple").get()).data().nested.keep, true);
await db.doc("weddings/couple").update({ "nested.change": 3 });
assert.equal((await db.doc("weddings/couple").get()).data().nested.change, 3);
await assert.rejects(() => db.doc("weddings/missing").update({ plan: "essencial" }), /FAILED_PRECONDITION/);
await assert.rejects(() => db.doc("weddings/couple").create({ plan: "essencial" }), /FAILED_PRECONDITION/);
const filtered = await db.collection("weddings").where("status", "==", "draft").orderBy("status").limit(1).get();
assert.equal(filtered.size, 1);
assert.equal(filtered.docs[0].ref.collection("members").doc("owner").path, "weddings/couple/members/owner");
abortNextCommit = true;
let attempts = 0;
await db.runTransaction(async transaction => {
  attempts++;
  const snapshot = await transaction.get(db.doc("weddings/couple"));
  assert(snapshot.exists);
  assert.equal((await transaction.get(db.collection("weddings"))).size, 1);
  transaction.set(db.doc("userWeddingLinks/owner"), { slug: "couple" });
});
assert.equal(attempts, 2);
assert.equal(rollbacks, 1);
await assert.rejects(() => db.runTransaction(async transaction => { transaction.set(db.doc("orders/no-write"), {}); throw new Error("permission rejected"); }), /permission rejected/);
assert.equal((await db.doc("orders/no-write").get()).exists, false);
await db.doc("weddings/couple/members/owner").set({ active: true, role: "admin" });
const { handlePaymentSuccess } = load("src/lib/stripe-fulfillment.ts", { "@/lib/firebase/admin": { services: () => ({ db }) } });
const session = { id: "payment", status: "complete", payment_status: "paid", amount_total: 49700, currency: "brl", metadata: { action: "new", plan: "essencial", weddingSlug: "couple", ownerUid: "owner", purchaseAttempt: "attempt" } };
assert.equal(await handlePaymentSuccess(session), true);
assert.equal((await db.doc("weddings/couple").get()).data().plan, "essencial");
assert((await db.doc("orders/payment").get()).data().fulfilledAt);
const writesBefore = commits.flatMap(commit => commit.writes).length;
assert.equal(await handlePaymentSuccess(session), true);
assert.equal(commits.flatMap(commit => commit.writes).length, writesBefore);
assert.equal(await handlePaymentSuccess({ ...session, id: "unpaid", payment_status: "unpaid" }), false);
await db.doc("weddings/couple/members/owner").update({ active: false });
await assert.rejects(() => handlePaymentSuccess({ ...session, id: "unauthorized" }), /não autorizado/);
assert.equal((await db.doc("orders/unauthorized").get()).exists, false);
console.log("Firestore REST: reads, queries, masks, preconditions, transaction rollback/retry, payment fulfillment, idempotency and authorization passed without dynamic code generation.");
