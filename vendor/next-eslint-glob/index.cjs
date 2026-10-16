// eslint-disable-next-line @typescript-eslint/no-require-imports -- Next ESLint loads this adapter through CommonJS.
const { globSync } = require("tinyglobby");

// Next's ESLint plugin only consumes globSync with onlyDirectories: true.
// fast-glob does not implicitly recurse into matched directories; tinyglobby does.
exports.globSync = (patterns, options = {}) => globSync(patterns, {
  ...options,
  expandDirectories: false,
});
