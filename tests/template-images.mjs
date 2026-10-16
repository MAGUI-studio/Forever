import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
function load(
  file,
  requireMock = () => {
    throw Error("Unexpected dependency");
  },
) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(readFileSync(new URL(file, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports, require: requireMock },
  );
  return exports;
}
const gallery = load("../src/config/gallery.ts");
const assets = load("../src/config/templates/romance-assets.ts");
const { resolveTemplateImage } = load("../src/lib/template-images.ts", (name) =>
  name === "@/config/gallery" ? gallery : assets,
);
const base = {
  couple: { coverImage: "", story: { image: "" } },
  ceremony: { image: "" },
  dressCode: { gallery: [] },
  customImages: {},
};
for (const slot of ["hero", "story", "dress"]) {
  const url = resolveTemplateImage(base, "minimalist-modern", slot);
  assert.equal(url, `/templates/minimalist-modern/${slot}.webp`);
  assert(existsSync(new URL(`../public${url}`, import.meta.url)));
}
const custom = structuredClone(base);
custom.couple.coverImage = "https://utfs.io/f/couple-photo.webp";
assert.equal(resolveTemplateImage(custom, "minimalist-modern", "hero"), custom.couple.coverImage);
custom.customImages["minimalist-modern.hero"] = "";
assert.equal(
  resolveTemplateImage(custom, "minimalist-modern", "hero"),
  "",
  "Explicit removals must not be replaced by decorative assets",
);
custom.customImages["minimalist-modern.hero"] = "/casal/festa-de-casamento.png";
assert.equal(
  resolveTemplateImage(custom, "minimalist-modern", "hero"),
  "/casal/festa-de-casamento.png",
  "An explicitly selected local image must render",
);
custom.dressCode.gallery = [{ image: "" }];
assert.equal(resolveTemplateImage(custom, "minimalist-modern", "dress"), "");
custom.dressCode.gallery[0].image = "/templates/minimalist-modern/dress.webp";
assert.equal(
  resolveTemplateImage(custom, "minimalist-modern", "dress"),
  custom.dressCode.gallery[0].image,
);
console.log("Generated assets, uploaded-photo priority and explicit removals passed.");

for (const [template, slots] of [
  ["botanical-classic", ["hero", "venue"]],
  ["contemporary-romance", ["hero", "story", "detail", "venue", "schedule"]],
]) {
  for (const slot of slots) {
    const url = resolveTemplateImage(base, template, slot);
    assert(existsSync(new URL(`../public${url}`, import.meta.url)));
  }
  const config = structuredClone(base);
  config.couple.coverImage = "https://utfs.io/f/my-photo.webp";
  assert.equal(resolveTemplateImage(config, template, "hero"), config.couple.coverImage);
  config.couple.coverImage = "/templates/contemporary-romance/hero.webp";
  assert.equal(
    resolveTemplateImage(config, template, "hero"),
    resolveTemplateImage(base, template, "hero"),
  );
}
