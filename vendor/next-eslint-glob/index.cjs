// eslint-disable-next-line @typescript-eslint/no-require-imports -- Next ESLint loads this adapter through CommonJS.
const { globSync } = require("tinyglobby");

exports.globSync = (patterns, options = {}) =>
  globSync(patterns, {
    ...options,
    expandDirectories: false,
  });
