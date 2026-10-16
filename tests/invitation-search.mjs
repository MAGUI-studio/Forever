import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/lib/invitation-search.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  { exports },
);
const normalized = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const reference = new Function(
  "invites",
  "normalizedQuery",
  "filter",
  "normalized",
  "return (" +
    '() =>\n      invites.filter(\n        (i) =>\n          (normalized(i.label).includes(normalizedQuery) ||\n            i.guests.some((g) => normalized(g.name).includes(normalizedQuery))) &&\n          (filter === "todos" ||\n            (filter === "abertos"\n              ? !!i.openedAt\n              : filter === "nao-respondidos"\n                ? i.active && i.guests.some((g) => g.status === "pendente")\n                : filter === "respondidos"\n                  ? i.guests.every((g) => g.status !== "pendente")\n                  : filter === "enviados"\n                    ? !!i.sentAt\n                    : filter === "nao-enviados"\n                      ? !i.sentAt\n                      : filter === "inativos"\n                        ? !i.active\n                        : i.active && i.guests.some((g) => g.status === filter))),\n      )' +
    ")();",
);
let cases = 0;
for (let size = 0; size < 80; size++) {
  const invites = Array.from({ length: size }, (_, i) => ({
    id: i,
    label: ["Família", "João", "Ana", "Bruna"][i % 4],
    active: i % 3 !== 0,
    openedAt: i % 2 ? "date" : null,
    sentAt: i % 4 ? "date" : null,
    guests: Array.from({ length: i % 5 }, (_, j) => ({
      name: ["Álvaro", "Bia", "Café"][j % 3],
      status: ["pendente", "confirmado", "recusado"][(i + j) % 3],
    })),
  }));
  const index = exports.invitationSearchIndex(invites),
    before = JSON.stringify(invites);
  for (const q of ["", "familia", "ÁLVARO", "joao", "Cafe", "no match", "Ana Bia"])
    for (const filter of [
      "todos",
      "abertos",
      "nao-respondidos",
      "respondidos",
      "enviados",
      "nao-enviados",
      "inativos",
      "pendente",
      "confirmado",
      "recusado",
    ]) {
      assert.deepEqual(
        Array.from(exports.searchInvitations(index, q, filter)),
        reference(invites, normalized(q), filter, normalized),
      );
      cases++;
    }
  assert.equal(JSON.stringify(invites), before);
}
console.log(
  "OK " +
    cases +
    " indexed invitation searches preserve accents, filters, empty groups and field boundaries",
);
