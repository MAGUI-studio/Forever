import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")),
  "..",
);
const cache = new Map();
function load(file) {
  file = path.resolve(root, file);
  if (cache.has(file)) return cache.get(file);
  if (file.endsWith(".json")) return JSON.parse(readFileSync(file, "utf8"));
  const exports = {};
  cache.set(file, exports);
  const output = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  vm.runInNewContext(output, {
    exports,
    process,
    URL,
    require: (name) => {
      let dependency = name.startsWith("@/")
        ? path.resolve(root, "src", name.slice(2))
        : name.startsWith(".")
          ? path.resolve(path.dirname(file), name)
          : null;
      if (!dependency) return require(name);
      if (!path.extname(dependency)) dependency += ".ts";
      assert(existsSync(dependency), dependency);
      return load(dependency);
    },
  });
  return exports;
}
const registry = load("src/config/templates/registry.ts");
const { weddingConfigSchema } = load("src/lib/wedding-schema.ts");
const { venueDisplayTips } = load("src/lib/wedding-settings.ts");
const templates = ["botanical-classic", "contemporary-romance", "minimalist-modern"];
for (const template of templates) {
  for (const style of ["botanical", "minimalist"]) {
    const fields = registry.templateCopyFields(template, style);
    assert.equal(
      new Set(fields.map((field) => field.key)).size,
      fields.length,
      "Duplicate editor fields",
    );
    const authored = Object.fromEntries(
      fields.map((field) => [field.key, `Personalizado: ${field.key}`]),
    );
    const parsed = weddingConfigSchema.pick({ copy: true }).parse({ copy: authored });
    for (const field of fields)
      assert.equal(
        registry.siteCopy(parsed.copy, field.key, template),
        authored[field.key],
        `${template}: ${field.key} must survive save and render`,
      );
    for (const key of [
      "events.separateIntro",
      "events.ceremonyDescription",
      "events.partyDescription",
      "gifts.emptyMessage",
      "rsvp.text2",
      "rsvp.text3",
    ]) {
      assert(
        fields.some((field) => field.key === key),
        `${template}: missing ${key}`,
      );
    }
    for (const key of style === "botanical"
      ? ["dressCode.color1Hex", "dressCode.color2Hex"]
      : ["pro.dress.label", "pro.dress.dosTitle", "pro.dress.dontsTitle", "pro.dress.paletteTitle"])
      assert(
        fields.some((field) => field.key === key),
        `${template}: missing ${key}`,
      );
  }
  const blank = { "events.separateIntro": "", "footer.text2": "" };
  const saved = registry.switchTemplateCopy(blank, template, template);
  assert.equal(saved["events.separateIntro"], "");
  assert.equal(saved["footer.text2"], "");
}
assert.equal(
  venueDisplayTips(
    { tips: "A cerimônia e a recepção acontecerão no mesmo local. Entrada pelo jardim." },
    false,
  ),
  "Entrada pelo jardim.",
);
assert.equal(venueDisplayTips({ tips: "Entrada pelo jardim." }, true), "Entrada pelo jardim.");
console.log(
  "All three templates preserve editable content, both dress styles and intentional empty text.",
);

for (const template of registry.templateIds) {
  const defaults = registry.templateCopyDefaults(template);
  for (const copy of [
    undefined,
    {},
    Object.fromEntries(Object.keys(defaults).map((key) => [key, ""])),
    Object.fromEntries(Object.keys(defaults).map((key) => [key, `Custom ${key}`])),
  ]) {
    for (const key of [...Object.keys(defaults), "missing.key"]) {
      let expected;
      if (key === "gifts.heading" && copy?.[key] === undefined)
        expected =
          (copy?.["gifts.text3"] ?? registry.copyDefaults["gifts.text3"]) +
          (copy?.["gifts.text4"] ?? registry.copyDefaults["gifts.text4"]);
      else if (key === "dressCode.heading" && copy?.[key] === undefined)
        expected =
          (copy?.["dressCode.text2"] ?? registry.copyDefaults["dressCode.text2"]) +
          (copy?.["dressCode.text3"] ?? registry.copyDefaults["dressCode.text3"]);
      else
        expected = registry.fixedCopyKeys.has(key)
          ? registry.copyDefaults[key]
          : (copy?.[key] ?? defaults[key] ?? "");
      assert.equal(registry.siteCopy(copy, key, template), expected);
    }
  }
  const changed = registry.templateCopyDefaults(template);
  changed["rsvp.text1"] = "mutated";
  assert.equal(registry.templateCopyDefaults(template)["rsvp.text1"], defaults["rsvp.text1"]);
}
console.log(
  "OK allocation-free text lookup preserves all four templates, fixed text, legacy headings and empty overrides",
);

const { rsvpPageConfig } = load("src/lib/rsvp-page-config.ts");
const config = {
  ...load("src/config/forever.ts").emptyWeddingConfig,
  copy: { "rsvp.text1": "Personalizado", "hero.text1": "Other" },
  gifts: [{ id: "gift", title: "Gift", price: 30 }],
  gallery: [{ id: "photo", url: "photo" }],
  customImages: { hero: "image" },
};
const before = JSON.stringify(config);
const rsvpConfig = rsvpPageConfig(config);
assert.equal(JSON.stringify(config), before);
assert.equal(rsvpConfig.couple.partner1, config.couple.partner1);
assert.equal(rsvpConfig.couple.partner2, config.couple.partner2);
assert.equal(rsvpConfig.gifts.length, 0);
assert.equal(rsvpConfig.gallery.length, 0);
assert.equal(rsvpConfig.couple.story, undefined);
assert.equal(Object.keys(rsvpConfig.customImages).length, 0);
for (const template of registry.templateIds)
  for (const key of Object.keys(registry.copyDefaults).filter((key) => key.startsWith("rsvp.")))
    assert.equal(
      registry.siteCopy(rsvpConfig.copy, key, template),
      registry.siteCopy(config.copy, key, template),
    );
console.log(
  "OK standalone RSVP keeps names and every displayed text without serializing gifts, gallery or story",
);

const { panelConfig } = load("src/lib/panel-config.ts");
assert.equal(panelConfig(config, "guests"), config);
assert.equal(panelConfig(config, "site"), config);
for (const section of ["overview", "tables", "buffet", "history", "team", "check-in"]) {
  const compact = panelConfig(config, section);
  assert.equal(compact.couple.partner1, config.couple.partner1);
  assert.equal(compact.couple.weddingDate, config.couple.weddingDate);
  assert.equal(compact.rsvp, config.rsvp);
  assert.equal(compact.gifts.length, 0);
  assert.equal(compact.gallery.length, 0);
  assert.equal(compact.copy, undefined);
}
assert.equal(JSON.stringify(config), before);
console.log(
  "OK admin summaries retain dates and names while full configuration remains available for PDFs and editing",
);
