import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
const slots = [];
let cursor = 0;
const palettes = {
  "contemporary-romance": { primary: "rose" },
  "minimalist-modern": { primary: "black" },
  "serene-breeze": { primary: "blue" },
};
const context = {};
const react = {
  createContext: () => context,
  useContext: () => context.value,
  useState: (initial) => {
    const index = cursor++;
    if (!slots[index])
      slots[index] = {
        value: typeof initial === "function" ? initial() : initial,
        set: (value) => {
          slots[index].value = value;
        },
      };
    return [slots[index].value, slots[index].set];
  },
  useMemo: (fn, deps) => {
    const index = cursor++;
    const prev = slots[index];
    if (!prev || deps.some((v, i) => !Object.is(v, prev.deps[i])))
      slots[index] = { value: fn(), deps };
    return slots[index].value;
  },
};
react.useCallback = (fn, deps) => react.useMemo(() => fn, deps);
const exports = {};
vm.runInNewContext(
  ts.transpileModule(readFileSync("src/components/wedding/WeddingProvider.tsx", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText,
  {
    exports,
    require: (name) => {
      if (name === "react") return react;
      if (name === "react/jsx-runtime")
        return {
          jsx: (type, props) => ({ type, props }),
          jsxs: (type, props) => ({ type, props }),
        };
      if (name.includes("wedding-settings"))
        return { synchronizeWeddingSettings: (config) => ({ ...config, synchronized: true }) };
      if (name.includes("templates/theme"))
        return { templatePalettes: palettes, weddingThemeStyle: (colors) => ({ ...colors }) };
      if (name.includes("templates/registry")) return { defaultTemplateId: "botanical-classic" };
      if (name.includes("config/modules"))
        return { resolveModules: () => ({ rsvp: true, tables: false }) };
      if (name.includes("config/forever"))
        return {
          emptyWeddingConfig: {},
          weddingPath: (slug, path) => "/" + slug + (path ? "/" + path : ""),
        };
      throw Error(name);
    },
  },
);
context.Provider = "provider";
const props = {
  slug: "couple",
  config: { label: "original" },
  templateId: "botanical-classic",
  children: "child",
};
const render = (overrides) => {
  cursor = 0;
  const tree = exports.WeddingProvider({ ...props, ...overrides });
  context.value = tree.props.value;
  assert.equal(tree.props.children.props.style, context.value.themeStyle);
  return context.value;
};
const first = render();
assert.equal(render({ children: "different child" }), first);
assert.equal(first.path("rsvp"), "/couple/rsvp");
first.setConfig({ label: "edited" });
const edited = render();
assert.notEqual(edited, first);
assert.equal(edited.config.label, "edited");
assert.equal(edited.themeStyle, first.themeStyle);
for (const template of Object.keys(palettes)) {
  edited.setTemplateId(template);
  const value = render();
  assert.deepEqual(value.themeStyle, palettes[template]);
  assert.equal(value.templateId, template);
  assert.equal(render(), value);
}
const preview = render({ preview: true, templateId: "botanical-classic" });
assert.equal(preview.config.label, "original");
assert.equal(preview.templateId, "botanical-classic");
preview.setTheme("rose");
const themed = render({ preview: true });
assert.equal(themed.themeStyle.primary, "#8B5263");
assert.equal(themed.themeStyle.hover, "color-mix(in srgb, #8B5263 80%, black)");
assert.equal(render({ slug: "another" }).path(), "/another");
themed.setModules({ tables: true });
assert.equal(render().modules.tables, true);
console.log(
  "OK provider preserves preview, config, template, themes, modules and paths while reusing unchanged context and styles",
);
