# fix/osmotic-3-peer

## Prompts

1. `package.json` had uncommitted changes on `master`: the version raised to 1.0.2 and the `osmotic` peer dependency
   widened from `^2.1.0` to `^2.0.0 || ^3.0.0`. Versions 1.0.1 and 1.0.2 were already published to npm from these
   changes.

   > commit the changes to package.json, push it, open a PR and merge it right away

## Interpretation

Bring the repository in line with the published 1.0.2: commit the `package.json` changes as they are, add the missing
changelog entry, and merge without further changes.

## Type

Other (dependency range update).

## Version bump

Patch, to 1.0.2, already published. 1.0.1 was published with the peer range `2.*.*|3.*.*`, which 1.0.2 replaced with the
same range in caret form.
