# feature/core-change-issues

## Prompts

1. Claude had proposed page commands (`click()`, `waitFor()` and others) that need a change to osmotic's plugin API, and
   offered to draft issues on both repos with `gh issue create`.

   > add to CLAUDE.md that in the event where we need changes from core, the proper communications channel is to set up an
   > issue on core:s repo.

## Interpretation

Add a section to CLAUDE.md saying that when work here needs a change in osmotic, it is requested by opening an issue on
`fisknils/osmotic` with `gh issue create`. The change isn't made in osmotic from this repo's branch. The section says
what the issue should contain, and that the branch here records the issue in `PLAN.md` and waits for the osmotic
release before depending on it.

## Type

Other (documentation).

## Version bump

None. CLAUDE.md isn't published.
