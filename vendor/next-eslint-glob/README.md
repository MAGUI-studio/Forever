# Next ESLint glob adapter

This private adapter is scoped to `@next/eslint-plugin-next` through npm overrides.
It replaces that plugin's only use of `fast-glob` (`globSync` for root directories)
with `tinyglobby`, removing the vulnerable `braces` dependency (GHSA-vfj7-8cjw-p6xm).
`expandDirectories: false` preserves fast-glob's behavior for exact directories and
brace patterns. This is deliberately not a general fast-glob replacement.

Remove the adapter once the upstream plugin no longer requires the vulnerable chain.
Run `node tests/security-dependencies.mjs` to verify root-directory matching and
UploadThing compatibility after changing either security override.

The root `effect` override stays on the 3.x line (3.22.3) to fix
GHSA-38f7-945m-qr2g without downgrading UploadThing. Its real route initialization
and public configuration response are covered by the same compatibility test.
