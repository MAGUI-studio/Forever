import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "@babel/parser";
const source = readFileSync("src/app/admin/panel.tsx", "utf8");
const ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] });
function findFunction(root, name, text = source) {
  let found;
  function visit(n) {
    if (!n || typeof n !== "object") return;
    if (n.type === "FunctionDeclaration" && n.id.name === name) found = n;
    else
      for (const [key, value] of Object.entries(n)) {
        if (["loc", "comments"].includes(key)) continue;
        if (Array.isArray(value)) value.forEach(visit);
        else visit(value);
      }
  }
  visit(root);
  assert(found, name);
  return text.slice(found.start, found.end);
}
const compiled = ts.transpileModule(
  "exports.load = " +
    findFunction(ast, "load") +
    ";exports.refreshReception = " +
    findFunction(ast, "refreshReception") +
    ";",
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;
const flush = () => new Promise((resolve) => setImmediate(resolve));
function fixture({
  role = "admin",
  section = "overview",
  enabled = { guestList: true, rsvp: true, siteEditor: true, tables: true },
  fail = false,
  modal = null,
} = {}) {
  const calls = [],
    state = {},
    redirects = [],
    exports = {};
  let release;
  const session = {
    role,
    wedding: {
      config: { couple: {} },
      theme: "rose",
      modules: enabled,
      plan: "foreverPro",
      templateId: "contemporary-romance",
    },
    panel: {
      invitations: ["invite"],
      tables: ["table"],
      team: ["team"],
      history: ["history"],
      settings: { enabled: true },
      invitationsLoaded: true,
    },
  };
  const env = {
    exports,
    Error,
    user: { uid: "user" },
    section,
    modalState: { modal },
    sectionModule: { tables: "tables", site: "siteEditor" },
    resolveModules: () => enabled,
    weddingPath: (part) => "/couple/" + part,
    router: { replace: (path) => redirects.push(path) },
    api: async (path) => {
      calls.push(path);
      return new Promise((resolve, reject) => {
        release = () =>
          fail
            ? reject(new Error("read failed"))
            : resolve(
                path.includes("session")
                  ? session
                  : { invitations: ["arrived"], tables: ["reception table"] },
              );
      });
    },
  };
  for (const name of [
    "Config",
    "Theme",
    "Modules",
    "TemplateId",
    "Plan",
    "Loading",
    "Role",
    "Tables",
    "OperationsData",
    "Invites",
    "InvitationsLoaded",
    "Settings",
    "Authorized",
    "LoadingMessage",
    "LoadedSection",
  ])
    env["set" + name] = (value) => {
      state[name] = value;
    };
  vm.runInNewContext(compiled, env);
  return { exports, calls, state, redirects, release: () => release() };
}
for (const section of [
  "overview",
  "guests",
  "tables",
  "buffet",
  "history",
  "team",
  "check-in",
  "site",
]) {
  const f = fixture({ section });
  const pending = f.exports.load();
  await flush();
  assert.deepEqual(f.calls, ["/api/admin/session?section=" + section]);
  assert.equal(f.state.Authorized, undefined);
  f.release();
  await pending;
  assert.equal(f.state.Authorized, true);
  assert.equal(f.state.Loading, false);
  if (section !== "site") {
    assert.equal(f.state.Invites[0], "invite");
    assert.equal(f.state.OperationsData.history[0], "history");
    assert.equal(f.state.InvitationsLoaded, true);
  }
}
for (const section of ["overview", "site", "check-in"]) {
  const f = fixture({ role: "reception", section });
  const p = f.exports.load();
  f.release();
  await p;
  assert.equal(f.redirects.length, section === "check-in" ? 0 : 1);
}
const blocked = fixture({ section: "tables", enabled: { tables: false } });
const b = blocked.exports.load();
blocked.release();
await b;
assert.equal(blocked.redirects[0], "/couple/painel");
assert.equal(blocked.state.Authorized, undefined);
const failed = fixture({ fail: true });
const failure = assert.rejects(failed.exports.load(), /read failed/);
failed.release();
await failure;
assert.equal(failed.state.Authorized, undefined);
const modal = fixture({ section: "history", modal: "edit-invitation" });
const m = modal.exports.load();
assert.equal(modal.calls[0], "/api/admin/session?section=history&invitations=1");
modal.release();
await m;
const reception = fixture();
const refresh = reception.exports.refreshReception();
assert.deepEqual(reception.calls, ["/api/admin/reception"]);
reception.release();
await refresh;
assert.equal(reception.state.Invites[0], "arrived");
console.log(
  "OK every admin screen loads in one request, keeps deep-link invitation modals, guards failures and refreshes only reception after check-in",
);

const eventSource = readFileSync("src/app/admin/EventOperations.tsx", "utf8");
const eventAst = parse(eventSource, { sourceType: "module", plugins: ["typescript", "jsx"] });
const saveCode = ts.transpileModule(
  "exports.save = " + findFunction(eventAst, "save", eventSource),
  { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
).outputText;
for (const failure of [null, "mutation", "refresh"]) {
  const calls = [],
    state = {},
    exports = {};
  vm.runInNewContext(saveCode, {
    exports,
    Error,
    setBusy: (value) => (state.busy = value),
    setError: (value) => (state.error = value),
    api: async (path, method) => {
      calls.push(method + " " + path);
      if (failure === "mutation") throw new Error("mutation failed");
    },
    onRefresh: async () => {
      calls.push("refresh parent");
      if (failure === "refresh") throw new Error("refresh failed");
    },
  });
  assert.equal(await exports.save({ action: "assign" }), !failure);
  assert.deepEqual(
    calls,
    failure === "mutation"
      ? ["POST /api/admin/operations"]
      : ["POST /api/admin/operations", "refresh parent"],
  );
  assert.equal(state.busy, false);
  if (failure) assert.equal(state.error, failure + " failed");
}
let polling;
function findPoll(n) {
  if (!n || typeof n !== "object") return;
  if (
    n.type === "CallExpression" &&
    n.callee.name === "useEffect" &&
    source.slice(n.start, n.end).includes("15000")
  )
    polling = source.slice(n.arguments[0].start, n.arguments[0].end);
  else
    for (const value of Object.values(n))
      if (Array.isArray(value)) value.forEach(findPoll);
      else findPoll(value);
}
findPoll(ast);
assert(polling);
const exportsPoll = {},
  updates = [];
let tick,
  resolveRead,
  requests = 0;
const document = { visibilityState: "visible" };
vm.runInNewContext(
  ts.transpileModule("exports.effect = " + polling, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  {
    exports: exportsPoll,
    authorized: true,
    section: "check-in",
    busy: false,
    document,
    setInterval: (callback) => {
      tick = callback;
      return 1;
    },
    clearInterval: () => {},
    api: () => {
      requests++;
      return new Promise((resolve) => (resolveRead = resolve));
    },
    setInvites: (value) => updates.push(value),
    setTables: (value) => updates.push(value),
  },
);
const cleanup = exportsPoll.effect();
const firstTick = tick();
await tick();
assert.equal(requests, 1);
resolveRead({ invitations: ["first"], tables: [] });
await firstTick;
assert.equal(updates.length, 2);
document.visibilityState = "hidden";
await tick();
assert.equal(requests, 1);
document.visibilityState = "visible";
const late = tick();
assert.equal(requests, 2);
cleanup();
resolveRead({ invitations: ["late"], tables: [] });
await late;
assert.equal(updates.length, 2);
console.log(
  "OK operations reuse parent data after saves and polling prevents overlapping reads and late updates",
);

const stale = fixture();
const staleLoad = stale.exports.load(undefined, () => false);
stale.release();
await staleLoad;
assert.equal(stale.state.Config, undefined);
assert.equal(stale.state.Authorized, undefined);
console.log("OK a previous screen's delayed response cannot overwrite the current screen's data");
