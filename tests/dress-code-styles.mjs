import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import ts from "typescript";
const runtimeRequire = createRequire(import.meta.url);
function load(
  file,
  requireMock = () => {
    throw Error("Unexpected import");
  },
) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    reportDiagnostics: true,
  });
  assert.equal(result.diagnostics.length, 0);
  const exports = {};
  vm.runInNewContext(result.outputText, { exports, require: requireMock });
  return exports;
}
const catalog = load("../src/config/dress-code.ts");
assert.deepEqual(Array.from(catalog.dressCodeStyleIds), ["botanical", "minimalist"]);
assert.deepEqual(
  Array.from(catalog.dressCodeStyles, (item) => item.label),
  ["Traços elegantes", "Noite de gala"],
);
let context;
const botanical = () => null,
  minimalist = () => null;
const jsx = (type, props) => ({ type, props });
const { DressCodeSection } = load("../src/components/wedding/DressCodeSection.tsx", (name) => {
  if (name === "react/jsx-runtime") return { jsx, jsxs: jsx };
  if (name === "./WeddingProvider") return { useWedding: () => context };
  if (name === "@/config/dress-code") return catalog;
  if (name === "./DressCode") return { DressCode: botanical };
  if (name === "./templates/MinimalistDressCode") return { MinimalistDressCode: minimalist };
  if (name.endsWith(".css")) return {};
  throw Error(name);
});
for (const templateId of [
  "botanical-classic",
  "contemporary-romance",
  "minimalist-modern",
  "serene-breeze",
]) {
  for (const style of catalog.dressCodeStyleIds) {
    context = { templateId, config: { dressCodeStyle: style } };
    const result = DressCodeSection();
    assert.equal(result.props["data-dress-style"], style);
    assert.equal(result.props.children.type, style === "botanical" ? botanical : minimalist);

    assert.equal(catalog.resolveDressCodeStyle(context.config, templateId), style);
  }
}
assert.equal(catalog.resolveDressCodeStyle({}, "botanical-classic"), "botanical");
const { weddingConfigSchema, weddingUpdateSchema } = load(
  "../src/lib/wedding-schema.ts",
  (name) => {
    if (name === "zod") return runtimeRequire("zod");
    if (name === "@/config/template-examples")
      return { EXAMPLE_PAYMENT_LINK: "https://example.com/sua-lista-de-presentes" };
    if (name === "@/config/dress-code") return catalog;
    if (name === "@/config/templates/registry")
      return {
        isTemplateAvailable: (id) => id !== "serene-breeze",
        templateIds: [
          "botanical-classic",
          "contemporary-romance",
          "minimalist-modern",
          "serene-breeze",
        ],
        copyDefaults: {},
        fixedCopyKeys: new Set(),
      };
    if (name === "@/config/gallery") return { MAX_GALLERY_PHOTOS: 6 };
    if (name === "@/config/forever") return { validWeddingSlug: () => true };
    throw Error(name);
  },
);
const schema = weddingConfigSchema.pick({ dressCodeStyle: true });
for (const style of catalog.dressCodeStyleIds)
  assert.equal(schema.parse({ dressCodeStyle: style }).dressCodeStyle, style);
assert.equal(schema.safeParse({ dressCodeStyle: "romance" }).success, false);
assert.equal(schema.safeParse({}).success, true);
console.log("Both dress-code styles work across all four templates and pass save validation.");

assert.equal(
  weddingUpdateSchema.innerType().shape.templateId.safeParse("serene-breeze").success,
  false,
);
for (const id of ["botanical-classic", "contemporary-romance", "minimalist-modern"])
  assert.equal(weddingUpdateSchema.innerType().shape.templateId.safeParse(id).success, true);
