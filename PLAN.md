# fix/tsconfig-layout

## Prompts

1. In osmotic, the maintainer asked about the difference between `tsconfig.json` and `tsconfig.dist.json`. Claude
   explained that editors only read files named `tsconfig.json`, and that it included only `src`, so files in `test/`
   and `test-d/` opened without a project and outside `strict`, here as in osmotic. The maintainer asked Claude to
   apply the usual layout (an editor-facing `tsconfig.json` over every file with `noEmit`, and a build-only
   `tsconfig.dist.json`), which became fisknils/osmotic#19.

   > Apply best practices

2. After #19 was ready:

   > merge, and fix the four plugins from here

## Interpretation

The same change as fisknils/osmotic#19:

- `tsconfig.json` covers `src`, `test` and `test-d` with `noEmit` and the shared compiler options, including
  `types: ["node"]` from the old test config, so the editor checks every file with the options `npm test` uses.
- `tsconfig.dist.json` extends it for the build: only `src`, emitting to `dist` with declarations and source maps.
- `tsconfig.test.json` goes away; `npm test` type-checks with `tsconfig.json`.
- CLAUDE.md's TypeScript section describes the new layout.

## Type

Other (build configuration).

## Version bump

None. The published files are byte for byte the same.

## Verification

- Before the change, `tsc -p tsconfig.json --listFilesOnly` listed no file from `test/` or `test-d/`; after it, 12.
- `dist/` built with `tsconfig.dist.json` is identical to the build from `master` (`diff -r`, 27 files).
- `npm test` passes, 15 tests. A type error added to a test file on purpose fails `tsc`, so the tests are still
  type-checked.
