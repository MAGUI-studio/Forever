/* eslint-disable @typescript-eslint/no-require-imports -- This Node CLI uses CommonJS in a project without type: module. */
const { execFileSync } = require("node:child_process");
const fs = require("node:fs/promises");
const { lstatSync } = require("node:fs");
const path = require("node:path");
const { parse } = require("@babel/parser");
const postcss = require("postcss");
const tokenizeCss = require("postcss/lib/tokenize");
const ts = require("typescript");

const projectRoot = __dirname;
const codeExtensions = new Set([
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".gs",
  ".css",
  ".json",
  ".jsonc",
  ".rules",
]);
const excludedDirectories = new Set([
  ".git",
  ".next",
  ".agents",
  ".codex",
  ".openai",
  ".qa",
  ".vercel",
  "node_modules",
  "public",
  "dist",
  "build",
  "out",
  "coverage",
]);
const excludedFiles = new Set(["package-lock.json", "skills-lock.json", "next-env.d.ts"]);

function isCodeFile(file) {
  const parts = file.replaceAll("\\", "/").split("/");
  return (
    !parts.some((part) => excludedDirectories.has(part)) &&
    !excludedFiles.has(parts.at(-1)) &&
    codeExtensions.has(path.extname(file))
  );
}

function collectCodeFiles() {
  const files = execFileSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      cwd: projectRoot,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    },
  )
    .split("\0")
    .filter(Boolean);
  return [...new Set(files)]
    .filter(isCodeFile)
    .filter((file) => {
      try {
        return lstatSync(path.join(projectRoot, file)).isFile();
      } catch (error) {
        if (error.code === "ENOENT") return false;
        throw error;
      }
    })
    .sort();
}

function isEssentialComment(comment) {
  const text = comment.trim();
  return (
    /^(?:eslint(?:-|\s|$)|global(?:s)?\s|exported\s|stylelint(?:-|\s)|prettier-(?:ignore|ignore-start|ignore-end)\b)/i.test(
      text,
    ) ||
    /(?:@ts-(?:check|nocheck|ignore|expect-error)\b|@jsx(?:ImportSource|Runtime|Frag)?\b|@flow\b|@noflow\b|@vite-ignore\b|webpack[A-Z]\w*\s*:)/.test(
      text,
    ) ||
    /@(?:type|typedef|satisfies|template|implements|extends|overload)\b|@(?:param|returns?)\s+\{/.test(
      text,
    ) ||
    /(?:[#@]__(?:PURE|NO_SIDE_EFFECTS)__|[#@]\s*(?:sourceMappingURL|sourceURL)\s*=|(?:istanbul|c8|v8)\s+ignore\b)/.test(
      text,
    ) ||
    /^\/\s*<(?:reference|amd-module|amd-dependency)\b/.test(text) ||
    /(?:@license\b|@preserve\b|SPDX-License-Identifier|copyright|\blicen[cs]e\b)/i.test(text)
  );
}

function applyRemovals(source, ranges) {
  let result = source;
  let boundary = source.length;
  for (const { start, end, jsx = false, compact = false } of ranges.sort(
    (a, b) => b.start - a.start || b.end - a.end,
  )) {
    if (end > boundary) continue;
    const replacement = jsx || compact ? "" : source.slice(start, end).replace(/[^\r\n]/g, " ");
    result = result.slice(0, start) + replacement + result.slice(end);
    boundary = start;
  }
  return result;
}

function stripJavaScript(source, filename) {
  const extension = path.extname(filename);
  const plugins = [];
  if ([".ts", ".tsx", ".mts", ".cts"].includes(extension)) plugins.push("typescript");
  if ([".js", ".jsx", ".tsx"].includes(extension)) plugins.push("jsx");
  const ast = parse(source, { sourceType: "unambiguous", plugins });
  const comments = ast.comments ?? [];
  const removable = comments.filter((comment) => !isEssentialComment(comment.value));
  const containers = [];
  const stack = [ast.program];
  while (stack.length) {
    const node = stack.pop();
    if (node.type === "JSXExpressionContainer" && node.expression.type === "JSXEmptyExpression") {
      const contained = comments.filter(
        (comment) => comment.start > node.start && comment.end < node.end,
      );
      if (contained.length && contained.every((comment) => !isEssentialComment(comment.value))) {
        containers.push({ start: node.start, end: node.end, jsx: true });
      }
    }
    for (const [key, value] of Object.entries(node)) {
      if (key.endsWith("Comments") || ["comments", "loc", "extra", "tokens"].includes(key))
        continue;
      if (Array.isArray(value))
        stack.push(...value.filter((child) => child && typeof child.type === "string"));
      else if (value && typeof value.type === "string") stack.push(value);
    }
  }
  const ranges = removable.filter(
    (comment) =>
      !containers.some(
        (container) => comment.start > container.start && comment.end < container.end,
      ),
  );
  return { code: applyRemovals(source, [...ranges, ...containers]), removed: removable.length };
}

function stripCss(source, filename) {
  postcss.parse(source, { from: filename });
  const tokens = tokenizeCss(new postcss.Input(source, { from: filename }));
  const ranges = [];
  while (!tokens.endOfFile()) {
    const token = tokens.nextToken();
    if (token[0] !== "comment" || isEssentialComment(token[1].slice(2, -2))) continue;
    const start = token[2];
    const end = token[3] + 1;
    const identifier = /[\w\-\\\u0080-\uffff]/;
    if (identifier.test(source[start - 1] ?? "") && identifier.test(source[end] ?? "")) continue;
    ranges.push({ start, end, compact: true });
  }
  return { code: applyRemovals(source, ranges), removed: ranges.length };
}

function stripScannedComments(source) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    source,
  );
  const ranges = [];
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (
      token !== ts.SyntaxKind.SingleLineCommentTrivia &&
      token !== ts.SyntaxKind.MultiLineCommentTrivia
    )
      continue;
    const text = scanner.getTokenText().replace(/^\/\/[ \t]?|^\/\*|\*\/$/g, "");
    if (!isEssentialComment(text))
      ranges.push({ start: scanner.getTokenPos(), end: scanner.getTextPos() });
  }
  return { code: applyRemovals(source, ranges), removed: ranges.length };
}

function stripComments(source, filename) {
  if (filename.endsWith(".css")) return stripCss(source, filename);
  if (/\.(?:jsonc?|rules)$/.test(filename)) return stripScannedComments(source);
  return stripJavaScript(source, filename);
}

async function stripAllComments() {
  const changes = [];
  let removed = 0;
  for (const file of collectCodeFiles()) {
    const filename = path.join(projectRoot, file);
    const source = await fs.readFile(filename, "utf8");
    const result = stripComments(source, file);
    if (result.code !== source) {
      changes.push({ filename, code: result.code });
      removed += result.removed;
    }
  }
  for (const { filename, code } of changes) await fs.writeFile(filename, code);
  console.log(`Removed ${removed} comments from ${changes.length} files.`);
}

module.exports = { projectRoot, collectCodeFiles, isCodeFile, isEssentialComment, stripComments };

if (require.main === module) {
  stripAllComments().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
