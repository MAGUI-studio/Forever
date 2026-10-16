import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = ts.transpileModule(readFileSync("src/app/api/admin/export/route.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const flush = () => new Promise((resolve) => setImmediate(resolve));
for (const enabled of [true, false]) {
  const reads = [],
    release = new Map(),
    exports = {};
  const modules = {
    guestList: enabled,
    team: enabled,
    history: enabled,
    rsvp: enabled,
    tables: enabled,
  };
  const read = (path, collection) => {
    reads.push(path);
    return new Promise((resolve) =>
      release.set(path, () =>
        resolve(
          collection
            ? { docs: [{ id: path, data: () => ({ label: path }) }] }
            : { data: () => ({ label: path }) },
        ),
      ),
    );
  };
  const db = {
    collection: (path) => ({ get: () => read(path, true) }),
    doc: (path) => ({ get: () => read(path, false) }),
  };
  vm.runInNewContext(source, {
    exports,
    require: (name) =>
      name.includes("config/modules")
        ? { resolveModules: () => modules, redactModuleData: (value) => value }
        : {
            requireAdminAccess: async () => ({ db, wedding: {} }),
            reply: (value) => value,
            failure: (error) => {
              throw error;
            },
          },
  });
  const pending = exports.GET({});
  await flush();
  const expected = enabled
    ? ["members", "invitations", "receptionTeam", "auditLog", "settings/rsvp", "settings/tables"]
    : ["members"];
  assert.deepEqual(reads, expected);
  for (const path of [...expected].reverse()) release.get(path)();
  const result = await pending;
  assert.equal(result.version, 1);
  assert.deepEqual(
    Object.keys(result.collections),
    enabled ? ["members", "invitations", "receptionTeam", "auditLog"] : ["members"],
  );
  assert.deepEqual(Object.keys(result.settings), enabled ? ["rsvp", "tables"] : []);
  for (const [key, docs] of Object.entries(result.collections)) assert.equal(docs[0].label, key);
  for (const [key, data] of Object.entries(result.settings))
    assert.equal(data.label, "settings/" + key);
}
console.log(
  "OK export starts all independent reads together and preserves payload order and disabled-module exclusions",
);
