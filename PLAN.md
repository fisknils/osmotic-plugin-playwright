# feature/contributing-sync

## Prompts

1. Start of the branch, on a clean `master` right after the 1.0.0 merge.

   > Update CLAUDE.md based on ..\osmotic\CLAUDE.md

2. Sent while CLAUDE.md was being edited, before anything but the plan was committed.

   > also, create a remote using gh

3. Claude had created the public repository, pushed `master`, and noted that the "Pull requests" section was left out
   because there was no CI workflow or branch protection yet.

   > Can you set up the protection on master via gh?

## Interpretation

`osmotic`'s CLAUDE.md has moved on since this repo's copy was made. Bring the changes over where they fit this repo:

- the plan template's Prompts section: give each prompt a short note on what it responds to, with an example;
- a "Writing tests" section, rewritten for this repo's helpers (`createSite()`, `runChain()`, `scripted()`), which
  differ from `osmotic`'s (`openSite()`, `scrape()`, scenario sites);
- "Skipping tests" as its own subsection;
- `tsconfig.test.json` includes `test` as well as `test-d`, which is already true here.

Also create a GitHub repository `fisknils/osmotic-plugin-playwright` with `gh`, add it as `origin` and push `master`.

Protect `master` the way `fisknils/osmotic` is protected: a pull request is required with no approvals, the checks
`Node.js 22`, `Node.js 24` and `Formatting` must pass on an up-to-date branch, admins are included, and force pushes and
deletion are blocked. Those checks need a workflow, so add osmotic's `.github/workflows/test.yml`, with a step that
installs Chromium for Playwright. With all that in place, bring over osmotic's "Pull requests" section and the
`gh pr merge --delete-branch` note too. Since `master` is protected from now on, this branch is merged through a pull
request.

## Type

Other (documentation).

## Version bump

None. CLAUDE.md isn't published.
