import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/lib/map-concurrent.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  { exports },
);
const { mapConcurrent } = exports;
const flush = () => new Promise((resolve) => setImmediate(resolve));
const started = [];
const release = new Map();
let inFlight = 0;
let peak = 0;
const pending = mapConcurrent(
  Array.from({ length: 12 }, (_, index) => index),
  async (value) => {
    started.push(value);
    inFlight++;
    peak = Math.max(peak, inFlight);
    await new Promise((resolve) => release.set(value, resolve));
    inFlight--;
    return value * 2;
  },
);
assert.equal(started.length, 6);
for (const value of [5, 4, 3, 2, 1, 0]) release.get(value)();
await flush();
assert.equal(started.length, 12);
for (const value of [11, 10, 9, 8, 7, 6]) release.get(value)();
assert.deepEqual(
  Array.from(await pending),
  Array.from({ length: 12 }, (_, index) => index * 2),
);
assert.equal(peak, 6);
assert.equal(inFlight, 0);
let calls = 0;
assert.equal(
  (
    await mapConcurrent([], async () => {
      calls++;
    })
  ).length,
  0,
);
assert.equal(calls, 0);
await assert.rejects(() => mapConcurrent([1], async (value) => value, 0), /positive integer/);
await assert.rejects(() => mapConcurrent([1], async (value) => value, 1.5), /positive integer/);
await assert.rejects(
  () =>
    mapConcurrent([1, 2], async () => {
      throw new Error("Read failed");
    }),
  /Read failed/,
);
console.log(
  "OK bounded parallel reads: 12 independent jobs in 2 waves, peak 6, stable ordering and error propagation",
);
