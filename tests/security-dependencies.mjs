import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pluginRequire = createRequire(require.resolve("@next/eslint-plugin-next"));
const { getRootDirs } = pluginRequire("./utils/get-root-dirs.js");
const normalize = paths => paths.map(value => value.replace(/\\/g, "/").replace(/\/$/, "")).sort();
const context = rootDir => ({cwd:process.cwd(),settings:{next:{rootDir}}});

// The scoped fast-glob alias must preserve the actual Next ESLint consumer's API.
assert.deepEqual(getRootDirs(context(undefined)), [process.cwd()]);
assert.deepEqual(normalize(getRootDirs(context("src/app/{admin,studio}"))), ["src/app/admin", "src/app/studio"]);
assert.deepEqual(normalize(getRootDirs(context(["src/app/{admin,studio}", "src/components/ui"]))), ["src/app/admin", "src/app/studio", "src/components/ui"]);
assert(normalize(getRootDirs(context("src/app/*"))).includes("src/app/admin"));
assert.deepEqual(getRootDirs(context("missing-project-*")), []);

// Exercise UploadThing's real Effect-backed route initialization without uploads or credentials.
const { createUploadthing, createRouteHandler } = require("uploadthing/next");
const f = createUploadthing();
const router = {image:f({"image/png":{maxFileSize:"1MB",maxFileCount:1}}).middleware(async()=>({userId:"test"})).onUploadComplete(async({file})=>({url:file.ufsUrl}))};
const {GET,POST} = createRouteHandler({router});
assert.equal(typeof POST,"function");
const response = await GET(new Request("http://localhost/api/uploadthing"));
assert.equal(response.status,200);
assert((await response.json()).some(route=>route.slug==="image"));
console.log("OK Next ESLint root globs and UploadThing route compatibility");
