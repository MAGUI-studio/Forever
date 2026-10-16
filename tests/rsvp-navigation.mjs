import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const source = readFileSync(
  new URL("../src/components/wedding/RSVPSection.tsx", import.meta.url),
  "utf8",
);
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const listeners = new Map();
const requests = [];
const effects = [];
let enteredCode = "";
let stateIndex = 0;
const window = {
  location: { hash: "#inicio" },
  addEventListener: (name, fn) => listeners.set(name, fn),
  removeEventListener: (name) => listeners.delete(name),
};
const fallback = new Proxy({}, { get: () => () => null });
const exports = {};
vm.runInNewContext(code, {
  exports,
  window,
  document: {
    getElementById: (id) =>
      ["inicio", "rsvp", "historia", "eventos", "dress-code", "galeria", "presentes"].includes(id)
        ? {}
        : null,
  },
  queueMicrotask: (fn) => fn(),
  fetch: (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return new Promise(() => {});
  },
  require: (name) => {
    if (name === "react")
      return {
        useEffect: (fn) => effects.push(fn),
        useState: (initial) => {
          const index = stateIndex++;
          return [
            initial,
            (value) => {
              if (index === 0) enteredCode = value;
            },
          ];
        },
      };
    if (name === "react/jsx-runtime") return { jsx: () => null, jsxs: () => null };
    if (name === "./WeddingProvider")
      return {
        useWedding: () => ({
          slug: "test-couple",
          modules: {},
          templateId: "minimalist-modern",
          config: {},
        }),
      };
    if (name === "./useSiteCopy") return { useSiteCopy: () => (key) => key };
    return fallback;
  },
});
exports.RSVPSection();
const cleanups = effects.map((fn) => fn());
assert.equal(enteredCode, "", "Opening #inicio must not fill the invite code");
assert.equal(requests.length, 0);
for (const anchor of ["inicio", "eventos", "rsvp", "galeria", "historia", "presentes"]) {
  window.location.hash = `#${anchor}`;
  listeners.get("hashchange")();
}
assert.equal(enteredCode, "", "Section navigation must leave the form unchanged");
assert.equal(requests.length, 0, "Section navigation must not look up an invitation");
window.location.hash = "#ABC234";
listeners.get("hashchange")();
assert.equal(enteredCode, "ABC-234");
assert.equal(requests[0].body.token, "ABC-234");
window.location.hash = "#inicio";
listeners.get("hashchange")();
assert.equal(enteredCode, "ABC-234", "Returning to the top must preserve an entered invitation");
assert.equal(requests.length, 1);
window.location.hash = `#${"a".repeat(48)}`;
listeners.get("hashchange")();
assert.equal(requests[1].body.token, "a".repeat(48), "Existing invitation links must still work");
cleanups.forEach((fn) => fn?.());
console.log("RSVP navigation regression checks passed.");
