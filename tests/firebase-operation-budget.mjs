import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const require = createRequire(import.meta.url);
const compile = (file) =>
  ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
const exports = {};
const gates = [];
let requests = 0,
  resolveResponse,
  rejectResponse;
vm.runInNewContext(compile("src/lib/auth-destination.ts"), {
  exports,
  fetch: () => {
    requests++;
    return new Promise((resolve, reject) => {
      gates.push(resolve);
      resolveResponse = resolve;
      rejectResponse = reject;
    });
  },
  require: () => ({ readApiResponse: async (response) => response }),
});
let tokens = 0;
const user = {
  getIdToken: async () => {
    tokens++;
    return "token";
  },
};
const flush = () => new Promise((resolve) => setImmediate(resolve));
const first = exports.resolveAuthDestination(user);
assert.equal(exports.resolveAuthDestination(user), first);
await flush();
assert.equal(requests, 1);
resolveResponse({ destination: "/couple/painel" });
await first;
const fresh = exports.resolveAuthDestination(user);
assert.notEqual(fresh, first);
await flush();
resolveResponse({ destination: "/contratar" });
assert.equal((await fresh).destination, "/contratar");
const failed = exports.resolveAuthDestination(user);
const rejected = assert.rejects(failed, /offline/);
await flush();
rejectResponse(new Error("offline"));
await rejected;
const retry = exports.resolveAuthDestination(user);
await flush();
resolveResponse({ destination: "/studio" });
await retry;
const a = exports.resolveAuthDestination(user),
  b = exports.resolveAuthDestination({ getIdToken: async () => "other" });
assert.notEqual(a, b);
await flush();
gates.at(-2)({ destination: "/first/painel" });
gates.at(-1)({ destination: "/second/painel" });
assert.equal((await a).destination, "/first/painel");
assert.equal((await b).destination, "/second/painel");

assert.equal(tokens, 5);
console.log(
  "OK simultaneous destination requests share one fetch; completed/failed results are discarded and accounts stay isolated",
);

const id = "a".repeat(64);
let current = {
  label: "Invite",
  sentAt: null,
  revision: 1,
  code: "ABC-DEF",
  guestCodes: { guest: "ABC-DEF", other: "ZZZ-222" },
};
let writes = [];
const db = {
  collection: (name) => ({ doc: (key) => ({ name, key }) }),
  runTransaction: async (callback) =>
    callback({
      get: async () => ({ exists: true, data: () => ({ ...current }) }),
      update: (_ref, value) => {
        writes.push("update");
        current = { ...current, ...value };
      },
      delete: (doc) => writes.push("delete:" + doc.name + ":" + doc.key),
    }),
};
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const server = {
  requireAdminAccess: async () => ({ db, email: "admin" }),
  body: async (request) => request.data,
  reply: (value) => value,
  HttpError,
  failure: (error) => {
    throw error;
  },
  inviteSchema: require("zod").z.object({}),
  tokenId: () => id,
};
const sent = {};
const sandbox = (result) => ({
  exports: result,
  require: (name) =>
    name === "zod"
      ? require(name)
      : name.includes("event-audit")
        ? { audit: () => writes.push("audit") }
        : name.includes("node:crypto")
          ? require(name)
          : server,
});
vm.runInNewContext(compile("src/app/api/admin/invites/sent/route.ts"), sandbox(sent));
for (const state of [false, true, true, false, false]) {
  const previous = current.sentAt;
  writes = [];
  const response = await sent.POST({ data: { id, sent: state } });
  const changed = previous !== response.sentAt;
  assert.deepEqual(writes, changed ? ["audit", "update"] : []);
}
const invites = {};
vm.runInNewContext(compile("src/app/api/admin/invites/route.ts"), sandbox(invites));
writes = [];
await invites.DELETE({ data: { id, revision: 1 } });
assert.equal(writes.filter((item) => item === "delete:codes:ABC-DEF").length, 1);
assert.equal(writes.filter((item) => item === "delete:codes:ZZZ-222").length, 1);
assert.equal(writes.filter((item) => item.startsWith("delete:invitations:")).length, 1);
console.log(
  "OK repeated delivery status performs zero writes and invitation removal deletes each code once",
);
