import { readFile, writeFile } from "node:fs/promises";

// OpenNext's server bundle keeps dependencies lazy. Firestore's protobuf
// descriptors generate constructors, which Workers allow only during startup.
const path = ".open-next/server-functions/default/handler.mjs";
const source = await readFile(path, "utf8");
const moduleHeader = /\/\/ [^\n]*node_modules\/firebase-admin\/lib\/firestore\/index\.js\r?\nvar (\w+) = __commonJS/g;
const factories = [...source.matchAll(moduleHeader)].map(match => match[1]);
if (factories.length !== 1) {
  throw new Error("Expected one Firestore module factory in the unminified OpenNext bundle; refusing to deploy without startup initialization.");
}
await writeFile(path, source + `\n// Initialize Firestore descriptors before the first request.\n${factories[0]}();\n`);
