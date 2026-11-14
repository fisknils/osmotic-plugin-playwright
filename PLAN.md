# feature/chromium-sandbox

## Prompts

1. The user had read that Playwright doesn't enable the Chrome sandbox by default, and asked whether that lets sites
   attack machines running Playwright. Claude confirmed that `chromiumSandbox` defaults to `false`. It explained that
   this doesn't give page JavaScript new powers on its own, but it means a renderer exploit alone is enough to run code
   on the machine, with no sandbox escape needed. That matters more for a crawler than for a testing tool. Claude
   offered three options: users opting in, the plugin defaulting to the sandbox, or keeping Playwright up to date.

   > Let's default chromiumSandbox to true

2. Sent while Claude was setting up the branch, about the Docker setups where the sandbox can't start:

   > but mention it in the README for the docker people

## Interpretation

The plugin launches the browser with `chromiumSandbox: true` unless the user's `launch` options say otherwise, so pages
the crawler visits run inside Chromium's sandbox. Users who can't run the sandbox, typically in Docker or as root on
Linux, turn it off with `launch: { chromiumSandbox: false }`. The README explains why it is on and how to turn it off.

## Type

Feature

## Breaking change

Yes. Where Chromium's sandbox can't start, such as in Docker containers running as root or on Linux hosts that block
unprivileged user namespaces, the browser fails to launch and rendered pages fail. To migrate, pass
`launch: { chromiumSandbox: false }`, or better, run as a non-root user with a seccomp profile that allows the sandbox.

## Version bump

Major (2.0.0)

## Scope

- Default `chromiumSandbox` to `true` in the launch options. A `chromiumSandbox` in the user's `launch` option wins.
- Document the default, why it's there, and how to turn it off in Docker, in the README and the `launch` option's
  TSDoc.
- Left out: other browser hardening, such as enforcing site isolation or warning about outdated Playwright versions.
  Firefox and WebKit ignore `chromiumSandbox`, so they don't change.

## Acceptance criteria

- [ ] Without a `launch` option, the browser is launched with `chromiumSandbox: true`, and pages still render.
- [ ] `launch: { chromiumSandbox: false }` launches the browser without the sandbox.
- [ ] The README documents the default and how to turn it off for Docker. (Documentation, so not tested.)

## Affected public API

- Option `launch`: its default changes from `{ headless: true }` to `{ headless: true, chromiumSandbox: true }`. No
  types change.

## Impact on the rest of the codebase

- Checked: `BrowserPool.launch()`, the only place the browser is launched; every test that launches a browser
  (`test/*.ts`, all through the default or a wrapped `chromium`); the README's options table and "The browser" section;
  the `launch` TSDoc in `src/types/options.ts`; the CI workflow, which runs Chromium on `ubuntu-latest`.
- Found: every test now launches with the sandbox, so CI on `ubuntu-latest` must be able to run it. If the runner
  can't, the fix is in the runner setup, not turning the sandbox off in tests.

## Decisions

- Major bump rather than minor: setups that worked before stop launching the browser until they change their options.
- The opt-out test (`test/sandbox-disabled.ts`) passes before the change, since user `launch` options already win. It is
  kept as a guard that the new default never overrides a user's `chromiumSandbox: false`. The default test
  (`test/sandbox.ts`) is the one that fails first.

## Verification

## Follow-ups

- `feature/click-command` also plans a major bump. Whichever merges second rebases and adjusts the version and
  changelog.
