import assert from "node:assert/strict";
import { createRequire } from "node:module";
import vm from "node:vm";
import prettier from "prettier";

const require = createRequire(import.meta.url);
const { stripComments, isCodeFile, isEssentialComment } = require("../stripComments.js");

const javascript = [
  "// Remove this line.",
  'const url = "https://example.com/a//b";',
  'const marker = "/* literal comment */";',
  "const expression = /https?:\\/\\/example\\.com/;",
  "const message = `// literal ${1 /* Remove this block. */ + 2}`;",
  "globalThis.result = [url, marker, expression.test(url), message];",
].join("\n");
const stripped = stripComments(javascript, "fixture.js");
assert.equal(stripped.removed, 2);
const originalContext = {},
  cleanedContext = {};
vm.runInNewContext(javascript, originalContext);
vm.runInNewContext(stripped.code, cleanedContext);
assert.equal(JSON.stringify(originalContext.result), JSON.stringify(cleanedContext.result));

const jsx =
  'const view = <div>First{/* Remove JSX */}Second<span title="// text">{/* Remove child */}</span></div>;';
const cleanedJsx = stripComments(jsx, "fixture.tsx");
assert.equal(cleanedJsx.removed, 2);
assert(cleanedJsx.code.includes("FirstSecond"));
assert(!cleanedJsx.code.includes("{/*"));
assert(cleanedJsx.code.includes('title="// text"'));
await prettier.format(cleanedJsx.code, { parser: "typescript" });

const asi = "function answer(){return /* Remove\nthis */ 123;} globalThis.value=answer();";
const before = {},
  after = {};
vm.runInNewContext(asi, before);
vm.runInNewContext(stripComments(asi, "fixture.js").code, after);
assert.equal(before.value, after.value);

for (const text of [
  "eslint-disable-next-line no-console",
  "@ts-expect-error required for this fixture",
  '/ <reference types="node" />',
  "#__PURE__",
  "webpackIgnore: true",
  "@license MIT",
  "Copyright Example Authors",
  "prettier-ignore",
  "c8 ignore next",
])
  assert(isEssentialComment(text), text);
const essential = "// @ts-check\n/* eslint-disable no-console */\n/* @license MIT */\nconst x = 1;";
assert.equal(stripComments(essential, "fixture.js").code, essential);

const css =
  '/* Remove */a{background:url("https://example.com/a//b");/* Remove */color:red}/*! @license MIT */';
const cleanedCss = stripComments(css, "fixture.css");
assert.equal(cleanedCss.removed, 2);
assert(cleanedCss.code.includes('a{background:url("https://example.com/a//b");'));
assert(cleanedCss.code.includes("color:red}/*! @license MIT */"));
await prettier.format(cleanedCss.code, { parser: "css" });
assert.equal(
  stripComments(".a/* Remove */.b{color:/* Remove */red}", "fixture.css").code,
  ".a.b{color:red}",
);
assert.equal(stripComments("a{width:1/**/px}", "fixture.css").code, "a{width:1/**/px}");
assert.equal(
  stripComments("a{background:url(https://example.com/a/*literal*/b)}", "fixture.css").removed,
  0,
);

const jsonc = '{"url":"https://example.com",/* Remove */"value":1}';
assert.deepEqual(JSON.parse(stripComments(jsonc, "fixture.jsonc").code), {
  url: "https://example.com",
  value: 1,
});
for (const file of [
  "src/app/page.tsx",
  "scripts/task.mjs",
  "google-apps-script/Code.gs",
  "firestore.rules",
  "formatCode.js",
])
  assert(isCodeFile(file), file);
for (const file of [
  "node_modules/pkg/index.js",
  ".next/types/index.ts",
  ".agents/skills/x/script.ts",
  ".codex/config.json",
  "package-lock.json",
  "skills-lock.json",
  "next-env.d.ts",
  "public/asset.svg",
])
  assert(!isCodeFile(file), file);
console.log("OK comment removal preserves strings, URLs, regex, JSX, ASI and essential directives");
