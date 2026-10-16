import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = ts.transpileModule(readFileSync("src/lib/invitation-fonts.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
}).outputText;
const exports = {};
const calls = [];
let fail = true;
vm.runInNewContext(source, {
  exports,
  Uint8Array,
  btoa,
  fetch: async (url) => {
    calls.push(url);
    return { ok: !fail, arrayBuffer: async () => Uint8Array.of(1, 2, 3).buffer };
  },
});
const first = exports.invitationFonts();
assert.equal(exports.invitationFonts(), first);
await assert.rejects(first, /fonte/);
assert.equal(calls.length, 4);
fail = false;
const retry = exports.invitationFonts();
assert.notEqual(retry, first);
assert.equal(exports.invitationFonts(), retry);
assert.deepEqual(Array.from(await retry), ["AQID", "AQID", "AQID", "AQID"]);
for (let i = 0; i < 20; i++) assert.equal(exports.invitationFonts(), retry);
assert.equal(calls.length, 8);
assert.equal(new Set(calls).size, 4);
console.log(
  "OK invitation fonts share concurrent loads and conversions, reuse successful results, and retry failures",
);
