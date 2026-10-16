import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";
const require = createRequire(import.meta.url),
  ts = require("typescript"),
  modules = new Map();
function load(filename) {
  const file = path.resolve(filename);
  if (modules.has(file)) return modules.get(file).exports;
  const module = { exports: {} };
  modules.set(file, module);
  const source = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const localRequire = (name) =>
    name.endsWith(".json")
      ? JSON.parse(fs.readFileSync(path.resolve(path.dirname(file), name), "utf8"))
      : name.startsWith("@/")
        ? load("src/" + name.slice(2) + ".ts")
        : name.startsWith(".")
          ? load(path.resolve(path.dirname(file), name + ".ts"))
          : require(name);
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(
    localRequire,
    module,
    module.exports,
  );
  return module.exports;
}
const { z } = require("zod");
const { weddingRegistrationFields, initialWeddingConfig } = load("src/lib/wedding-registration.ts");
const registration = z.object(weddingRegistrationFields);
const data = { partner1: "Ana", partner2: "Pedro", weddingDate: "2099-05-29" };
assert(registration.safeParse(data).success);
for (const weddingDate of [undefined, "", "invalid", "2099-02-30", "2000-01-01"])
  assert(!registration.safeParse({ ...data, weddingDate }).success);
assert(!registration.safeParse({ ...data, partner1: "   " }).success);
const config = initialWeddingConfig(data);
assert.equal(config.couple.weddingDate, "2099-05-29T12:00:00-03:00");
const { weddingUpdateSchema } = load("src/lib/wedding-schema.ts");
const update = { config, theme: "botanical", status: "published" };
assert(!weddingUpdateSchema.safeParse(update).success);
config.ceremony.placeName = "Local da cerimônia";
assert(weddingUpdateSchema.safeParse(update).success);
config.sameVenue = false;
assert(!weddingUpdateSchema.safeParse(update).success);
config.party.placeName = "   ";
assert(!weddingUpdateSchema.safeParse(update).success);
config.party.placeName = "Local da festa";
assert(weddingUpdateSchema.safeParse(update).success);
config.couple.weddingDate = "";
config.ceremony.placeName = "";
const missing = weddingUpdateSchema.safeParse(update);
assert(!missing.success);
assert(missing.error.issues.some((issue) => issue.path.join(".") === "config.couple.weddingDate"));
assert(missing.error.issues.some((issue) => issue.path.join(".") === "config.ceremony.placeName"));
assert(weddingUpdateSchema.safeParse({ ...update, status: "draft" }).success);
config.couple.weddingDate = "invalid";
assert(!weddingUpdateSchema.safeParse(update).success);
config.couple.weddingDate = "2099-05-29T12:00:00-03:00";
config.ceremony.placeName = "Local";
config.gifts = [
  { id: "gift", title: "", price: 0, category: "gift", categoryLabel: "Presente", image: "" },
];
assert(!weddingUpdateSchema.safeParse(update).success);
config.gifts[0].title = "Lua de mel";
config.gifts[0].price = 100;
config.giftPaymentLink = "https://example.com/sua-lista-de-presentes";
assert(!weddingUpdateSchema.safeParse(update).success);
config.giftPaymentLink = "https://example.com/pay";
assert(weddingUpdateSchema.safeParse(update).success);
const { generateGoogleCalendarUrl, generateIcsFileContent } = load("src/lib/calendar.ts");
for (const startDateISO of ["", "invalid"]) {
  const event = { title: "Casamento", description: "", location: "", startDateISO };
  assert.equal(generateGoogleCalendarUrl(event), "");
  assert.equal(generateIcsFileContent(event), "");
}
assert(
  generateGoogleCalendarUrl({
    title: "Casamento",
    description: "",
    location: "",
    startDateISO: data.weddingDate,
  }).startsWith("https://calendar.google.com/"),
);
console.log(
  "OK cadastro compartilhado, data obrigatória, publicação, locais, presentes e calendário legado",
);
