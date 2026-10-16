import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "@babel/parser";
import ts from "typescript";
const source = readFileSync("src/app/admin/EventOperations.tsx", "utf8"),
  ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] });
let body;
function walk(n) {
  if (!n || typeof n !== "object") return;
  if (n.type === "VariableDeclarator" && n.id.name === "tableOccupancy")
    body = source.slice(n.init.arguments[0].start, n.init.arguments[0].end);
  else
    for (const [key, v] of Object.entries(n)) {
      if (key === "loc") continue;
      if (Array.isArray(v)) v.forEach(walk);
      else walk(v);
    }
}
walk(ast);
assert(body);
const compute = new Function(
  "confirmed",
  ts.transpileModule("return (" + body + ")();", {}).outputText,
);
for (let size = 0; size < 300; size++) {
  const confirmed = Array.from({ length: size }, (_, i) => ({
    guest: { tableId: [undefined, "", "table1", "table2", "table3"][i % 5] },
  }));
  const map = compute(confirmed);
  for (const id of ["", "table1", "table2", "table3", "missing"])
    assert.equal(map.get(id) ?? 0, confirmed.filter((row) => row.guest.tableId === id).length);
}
console.log("OK indexed table occupancy matches previous per-table scans across 300 guest lists");
