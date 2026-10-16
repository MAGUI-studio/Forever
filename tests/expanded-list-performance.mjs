import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const source = readFileSync("src/app/admin/table-url-state.ts", "utf8");
const parser = {
  withDefault() {
    return this;
  },
  withOptions() {
    return this;
  },
  serialize: (value) =>
    Object.keys(value)
      .sort((a, b) => (a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b)))
      .map((id) => (value[id] ? id : "!" + id))
      .join(","),
};
const nuqs = {
  createParser: () => parser,
  parseAsStringLiteral: () => parser,
  parseAsString: parser,
  parseAsBoolean: parser,
};
const exports = {};
vm.runInNewContext(
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  { exports, require: () => nuqs },
);
const old = {};
vm.runInNewContext(
  ts.transpileModule(
    "export function compactExpanded(value: Record<string, boolean>, ids: string[]) {\n  const prefix = (id: string) => {\n    let length = 6;\n    while (\n      length < id.length &&\n      ids.some((other) => other !== id && other.startsWith(id.slice(0, length)))\n    )\n      length++;\n    return id.slice(0, length);\n  };\n  const open = ids.filter((id) => value[id]);\n  if (!open.length) return {};\n  const direct = Object.fromEntries(open.map((id) => [prefix(id), true]));\n  const inverse = {\n    all: true,\n    ...Object.fromEntries(ids.filter((id) => !value[id]).map((id) => [prefix(id), false])),\n  };\n  return expandedParser.serialize(inverse).length < expandedParser.serialize(direct).length\n    ? inverse\n    : direct;\n}\n" +
      "exports.reference = compactExpanded;",
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
  ).outputText,
  { exports: old, expandedParser: parser },
);
let seed = 17;
const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
const datasets = [
  [],
  ["a"],
  ["abcdef", "abcdef"],
  ["abcdef", "abcdef1", "abcdef12"],
  ["abcdef1", "abcdef2", "abcdef3"],
  Array.from({ length: 1000 }, (_, i) => "abcdef" + i.toString(16).padStart(58, "0")),
];
for (let i = 0; i < 100; i++)
  datasets.push(
    Array.from({ length: i }, () =>
      Array.from({ length: 12 }, () => Math.floor(random() * 4).toString()).join(""),
    ),
  );
for (const ids of datasets)
  for (const chance of [0, 0.1, 0.5, 0.9, 1]) {
    const value = Object.fromEntries(ids.map((id) => [id, random() < chance]));
    const before = JSON.stringify({ ids, value });
    assert.equal(
      JSON.stringify(exports.compactExpanded(value, ids)),
      JSON.stringify(old.reference(value, ids)),
    );
    assert.equal(JSON.stringify({ ids, value }), before);
  }
console.log(
  "OK 530 expansion URL comparisons preserve duplicate IDs, prefix collisions and direct/inverse encoding, including 1000 invitations",
);

const previousResolve = {};
vm.runInNewContext(
  ts.transpileModule(
    'export function resolveExpanded(value: Record<string, boolean>, ids: string[]) {\n  const result: Record<string, boolean> = {};\n  if (value.all) for (const id of ids) result[id] = true;\n  for (const [prefix, open] of Object.entries(value)) {\n    if (prefix === "all") continue;\n    const matches = ids.filter((id) => id.startsWith(prefix));\n    if (matches.length === 1) result[matches[0]] = open;\n  }\n  return result;\n}\n' +
      "exports.resolve = resolveExpanded;",
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } },
  ).outputText,
  { exports: previousResolve },
);
for (const ids of datasets) {
  for (const value of [
    { all: true },
    {},
    { all: true, ...Object.fromEntries(ids.slice(0, 15).map((id) => [id.slice(0, 6), false])) },
    Object.fromEntries(ids.slice(0, 15).map((id) => [id, true])),
  ]) {
    assert.equal(
      JSON.stringify(exports.resolveExpanded(value, ids)),
      JSON.stringify(previousResolve.resolve(value, ids)),
    );
  }
}
console.log(
  "OK expansion lookup preserves ambiguous prefixes, duplicate IDs, all/open overrides and property order with binary search",
);
