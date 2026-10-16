import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/lib/gift-catalog.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  { exports },
);
const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
const reference = (gifts, query, sort) => {
  const q = normalize(query.trim());
  let list = q
    ? gifts.filter(
        (item) =>
          normalize(item.title).includes(q) ||
          normalize(item.description ?? "").includes(q) ||
          normalize(item.categoryLabel ?? "").includes(q),
      )
    : gifts;
  if (sort === "price-asc") list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
  else if (sort === "price-desc") list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
  return list;
};
let cases = 0;
for (let size = 0; size < 100; size++) {
  const gifts = Array.from({ length: size }, (_, i) => ({
    id: String(i % 7),
    title: ["Café", "Panela", "Lua de mel", "Jogo de taças"][i % 4],
    description: [undefined, "Vidro", "Aço", ""][i % 4],
    categoryLabel: ["Casa", undefined, "Cozinha", "Decoração"][i % 4],
    price: [0, undefined, 100, 100, 50][i % 5],
  }));
  const before = JSON.stringify(gifts),
    index = exports.giftSearchIndex(gifts);
  for (const query of [
    "",
    "  ",
    "CAFE",
    " taÇas ",
    "decoracao",
    "aco",
    "Panela Vidro",
    "Not found",
  ])
    for (const sort of ["default", "price-asc", "price-desc"]) {
      assert.deepEqual(
        Array.from(exports.searchGifts(gifts, index, query, sort)),
        reference(gifts, query, sort),
      );
      cases++;
    }
  assert.equal(exports.searchGifts(gifts, index, "", "default"), gifts);
  const saved = exports.savedGiftIndex(gifts);
  for (const id of ["0", "3", "missing"])
    assert.equal(
      saved.get(id),
      gifts.find((g) => g.id === id),
    );
  assert.equal(JSON.stringify(gifts), before);
}
assert.equal(exports.savedGiftIndex(undefined).size, 0);
let reads = 0;
const gift = {
  id: "one",
  get title() {
    reads++;
    return "Café";
  },
  description: "Vidro",
  categoryLabel: "Casa",
};
const gifts = [gift],
  index = exports.giftSearchIndex(gifts);
for (const query of ["c", "ca", "caf", "cafe"]) exports.searchGifts(gifts, index, query, "default");
assert.equal(reads, 1);
console.log(
  `OK ${cases} gift searches preserve accents, field boundaries, prices, ties and duplicate IDs; text indexed once across queries`,
);
