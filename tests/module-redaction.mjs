import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const compile = (source) =>
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
let sets = 0;
const exports = {};
class CountedSet extends Set {
  constructor(...args) {
    super(...args);
    sets++;
  }
}
vm.runInNewContext(compile(readFileSync("src/config/modules.ts", "utf8")), {
  exports,
  Set: CountedSet,
});
const old = {};
vm.runInNewContext(
  compile(
    'export function redactModuleData<T>(value: T, modules: WeddingModules): T {\n  if (Array.isArray(value)) return value.map((item) => redactModuleData(item, modules)) as T;\n  if (value && typeof value === "object") {\n    const hidden = new Set<string>();\n    if (!modules.dietaryRestrictions) hidden.add("dietaryRestrictions");\n    if (!modules.messages) hidden.add("message");\n    if (!modules.invitationTracking)\n      for (const key of ["sentAt", "openedAt", "personalOpenedAt"]) hidden.add(key);\n    return Object.fromEntries(\n      Object.entries(value)\n        .filter(([key]) => !hidden.has(key))\n        .map(([key, item]) => [key, redactModuleData(item, modules)]),\n    ) as T;\n  }\n  return value;\n}\n',
  ),
  { exports: old },
);
const data = Array.from({ length: 300 }, (_, i) => ({
  id: i,
  message: "private",
  dietaryRestrictions: "restriction",
  sentAt: "date",
  openedAt: "date",
  personalOpenedAt: { guest: "date" },
  personalResponses: { guest: { message: "personal", dietaryRestrictions: "personal" } },
  guests: [{ id: i, name: "Guest", status: "pendente" }],
  extra: JSON.parse('{"__proto__":{"message":"hidden","safe":true},"constructor":"value"}'),
}));
const before = JSON.stringify(data);
for (const messages of [false, true])
  for (const dietaryRestrictions of [false, true])
    for (const invitationTracking of [false, true]) {
      const modules = { messages, dietaryRestrictions, invitationTracking };
      sets = 0;
      const result = exports.redactModuleData(data, modules);
      assert.equal(JSON.stringify(result), JSON.stringify(old.redactModuleData(data, modules)));
      assert.equal(sets, 1);
      assert.equal(JSON.stringify(data), before);
      assert.notEqual(result, data);
      assert.notEqual(result[0], data[0]);
    }
for (const input of [null, undefined, "text", 0, true, [], {}])
  assert.equal(
    JSON.stringify(exports.redactModuleData(input, {})),
    JSON.stringify(old.redactModuleData(input, {})),
  );
for (const plan of [undefined, "essencial", "foreverPro", null]) {
  const result = exports.resolveModules({ guestList: false, team: true }, plan);
  for (const key of exports.moduleKeys) {
    const expected =
      plan === null
        ? false
        : plan === "essencial"
          ? !exports.foreverProExclusiveModules.has(key)
          : true;
    assert.equal(result[key], expected);
  }
  const other = exports.resolveModules(undefined, plan);
  result.guestList = !result.guestList;
  assert.notEqual(result.guestList, other.guestList);
}
console.log(
  "OK redaction preserves nested privacy and object semantics across 300 invitations and all module combinations, with one rule set per response",
);
