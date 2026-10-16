/* eslint-disable @typescript-eslint/no-require-imports -- This Node CLI uses CommonJS in a project without type: module. */
const fs = require("node:fs/promises");
const path = require("node:path");
const prettier = require("prettier");
const { projectRoot, collectCodeFiles, stripComments } = require("./stripComments.js");

async function formatCode({ check = false } = {}) {
  const files = collectCodeFiles();
  const changes = [];
  let removed = 0;
  for (const file of files) {
    const filename = path.join(projectRoot, file);
    const source = await fs.readFile(filename, "utf8");
    const stripped = stripComments(source, file);
    const options = (await prettier.resolveConfig(filename)) ?? {};
    const code = file.endsWith(".rules")
      ? stripped.code
          .split(/\r?\n/)
          .map((line) => line.trimEnd())
          .join("\n")
      : await prettier.format(stripped.code, {
          ...options,
          filepath: filename,
          ...(file.endsWith(".gs") ? { parser: "babel" } : {}),
        });
    removed += stripped.removed;
    if (code !== source) changes.push({ filename, code, file });
  }
  if (check) {
    if (changes.length) {
      console.error(
        `Formatting or comment cleanup needed in ${changes.length} files:\n${changes.map((change) => change.file).join("\n")}`,
      );
      process.exitCode = 1;
    } else console.log(`All ${files.length} files are formatted and free of unnecessary comments.`);
    return;
  }
  for (const { filename, code } of changes) await fs.writeFile(filename, code);
  console.log(`Formatted ${changes.length} of ${files.length} files; removed ${removed} comments.`);
}

module.exports = { formatCode };

if (require.main === module) {
  formatCode({ check: process.argv.includes("--check") }).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
