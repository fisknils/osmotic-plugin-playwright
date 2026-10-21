# feature/contributing-sync

## Prompts

1. Start of the branch, on a clean `master` right after the 1.0.0 merge.

   > Update CLAUDE.md based on ..\osmotic\CLAUDE.md

2. Sent while CLAUDE.md was being edited, before anything but the plan was committed.

   > also, create a remote using gh

## Interpretation

`osmotic`'s CLAUDE.md has moved on since this repo's copy was made. Bring the changes over where they fit this repo:

- the plan template's Prompts section: give each prompt a short note on what it responds to, with an example;
- a "Writing tests" section, rewritten for this repo's helpers (`createSite()`, `runChain()`, `scripted()`), which
  differ from `osmotic`'s (`openSite()`, `scrape()`, scenario sites);
- "Skipping tests" as its own subsection;
- `tsconfig.test.json` includes `test` as well as `test-d`, which is already true here.

Also create a GitHub repository `fisknils/osmotic-plugin-playwright` with `gh`, add it as `origin` and push `master`.

Left out: the "Pull requests" section and the `gh pr merge --delete-branch` note. This repo has no
`.github/workflows/test.yml` and no branch protection, so that section would describe a setup that doesn't exist.

## Type

Other (documentation).

## Version bump

None. CLAUDE.md isn't published.
