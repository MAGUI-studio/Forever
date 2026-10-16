import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { parse } from "@babel/parser";
const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/lib/invitation-sort.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  { exports },
);
const source = readFileSync("src/app/admin/GuestsTableView.tsx", "utf8");
const ast = parse(source, { sourceType: "module", plugins: ["typescript", "jsx"] });
let current;
function walk(n) {
  if (!n || typeof n !== "object") return;
  if (n.type === "VariableDeclarator" && n.id.name === "sortedInvitations")
    current = source.slice(n.init.arguments[0].start, n.init.arguments[0].end);
  else
    for (const v of Object.values(n))
      if (Array.isArray(v)) v.forEach(walk);
      else walk(v);
}
walk(ast);
const compile = (body) =>
  new Function(
    "filteredInvitations",
    "sortField",
    "sortDirection",
    "invitationStatusScore",
    ts.transpileModule("return (" + body + ")();", {}).outputText,
  );
const before = compile(
    '() => {\n    return [...filteredInvitations].sort((a, b) => {\n      let comparison = 0;\n      if (sortField === "label") {\n        comparison = a.label.localeCompare(b.label, "pt-BR");\n      } else if (sortField === "guestsCount") {\n        comparison = a.guests.length - b.guests.length;\n      } else if (sortField === "sentAt") {\n        const timeA = a.sentAt ? new Date(a.sentAt).getTime() : 0;\n        const timeB = b.sentAt ? new Date(b.sentAt).getTime() : 0;\n        comparison = timeA - timeB;\n      } else if (sortField === "status") {\n        const score = (inv: Invitation) => {\n          const total = inv.guests.length;\n          const conf = inv.guests.filter((g) => g.status === "confirmado").length;\n          if (conf === total) return 3;\n          if (conf > 0) return 2;\n          const pend = inv.guests.filter((g) => g.status === "pendente").length;\n          if (pend > 0) return 1;\n          return 0;\n        };\n        comparison = score(a) - score(b);\n      }\n      return sortDirection === "asc" ? comparison : -comparison;\n    });\n  }',
  ),
  after = compile(current);
let seed = 7;
const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
for (let sample = 0; sample < 100; sample++) {
  const invitations = Array.from({ length: sample }, (_, i) => ({
    id: i,
    label: ["Álvaro", "Ana", "João", "Bruna"][i % 4],
    sentAt: [null, "2026-01-01", "invalid", "2025-01-01"][i % 4],
    guests: Array.from({ length: Math.floor(random() * 8) }, () => ({
      status: ["confirmado", "pendente", "recusado"][Math.floor(random() * 3)],
    })),
  }));
  const original = JSON.stringify(invitations);
  for (const field of ["label", "guestsCount", "status", "sentAt"])
    for (const direction of ["asc", "desc"]) {
      let scoreCalls = 0;
      const result = after(invitations, field, direction, (inv) => {
        scoreCalls++;
        return exports.invitationStatusScore(inv);
      });
      assert.deepEqual(
        result.map((i) => i.id),
        before(invitations, field, direction).map((i) => i.id),
      );
      assert.equal(scoreCalls, field === "status" ? invitations.length : 0);
    }
  assert.equal(JSON.stringify(invitations), original);
}
console.log(
  "OK 800 sort comparisons preserve ordering, ties, empty groups and dates; status computed once per invitation",
);
