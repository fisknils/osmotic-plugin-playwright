# feature/playwright-plugin

## Prompts

1. "I need you to create a playwright plugin for osmotic, which you can find in ..\osmotic"
2. "have a look at CLAUDE.md and update the project accordingly. if this isn't a git repo yet, run `git init`"
3. "Change the output "distribution/" to "dist/""

## Interpretation

Build `osmotic-plugin-playwright`: an osmotic plugin, in the format `Osmotic.plugins()` loads, that renders pages in a
real browser with Playwright, so content built by JavaScript can be scraped with the usual osmotic commands. Then bring
the project in line with CLAUDE.md: a git repository, this branch and plan, test-first commits, the `src/` folder
layout, layered tsconfigs, TypeScript tests in `test/` and `test-d/`, and the build output in `dist/`.

## Type

Feature.

## Breaking change

No. This is the first release.

## Version bump

None: the package starts at 1.0.0.

## Scope

In:

- Fetch middleware that loads each URL in a browser page and returns the rendered HTML as the `Response`, keeping the
  real status, `Content-Type` and final URL.
- A `render(options | false)` command that sets render options for the pages loaded after it in that branch.
- Render options `waitUntil`, `waitFor`, `timeout`, `block` and `actions`, and plugin options `renderAll`,
  `browserType`, `launch` and `context`.
- osmotic's `userAgent`, `headers` and per-slot `proxy` applied in the browser.
- One shared browser, launched on the first rendered request and closed after the last run ends.
- CommonJS and ESM entry points, type declarations, README, CHANGELOG and examples.

Out:

- Screenshots, PDFs and HAR capture as built-in options; `actions` can do them.
- Keeping pages open for later chain steps to interact with. Steps only see the captured HTML.
- Support for osmotic 3.x, which is not published yet.

## Acceptance criteria

- [ ] Content built by a page's scripts is visible to `set()`.
- [ ] `render(false)` fetches the pages after it without the browser.
- [ ] With `renderAll: false`, only pages loaded after a `render()` step are rendered.
- [ ] `waitFor` waits for content that appears after the load event.
- [ ] `actions` runs before the HTML is captured.
- [ ] Render options apply to the pages loaded after the step, including those loaded by `follow()`.
- [ ] `block` keeps matching resource types from loading.
- [ ] The `page` event reports the URL after redirects, and links resolve against it.
- [ ] Non-2xx responses are skipped with reason `status`, without waiting for `waitFor`.
- [ ] Non-HTML responses are skipped with reason `contentType`.
- [ ] A navigation or `waitFor` timeout is reported as an `error` event.
- [ ] osmotic's `userAgent` and `headers` are sent by the browser.
- [ ] Concurrent runs share one browser, and it is closed after the last one ends.
- [ ] `require` and `import` of the build return the same plugin function, which `plugins()` accepts directly.
- [ ] TypeScript callers get `render()` on `Osmotic` and the options types, from both entry points (`test-d/`).
- [ ] Per-slot proxies reach the browser context. Not covered by an automated test: it needs a proxy server. Checked by
      reading the code path; see Verification.

## Affected public API

- Default export: `playwright(options?)`, returning the plugin `osmotic-plugin-playwright`.
- Command: `render(options?: RenderOptions | false)`, declared on `Osmotic`.
- Types: `PlaywrightPluginOptions`, `RenderOptions`.

## Impact on the rest of the codebase

- Checked: osmotic's plugin loading (`src/plugins.ts`), fetch middleware chain (`src/http.ts`), `fetchPage()` and the
  run lifecycle (`src/osmotic.ts`), including how a constructed `Response` without a `url` is handled; osmotic's
  unreleased `feature/export` branch (3.0.0) for changes to the plugin API.
- Found: osmotic falls back to the requested URL when `Response.url` is empty, so the plugin sets `url` on the
  instance to report redirects. osmotic 3.0.0 adds exporters to plugins but leaves commands and fetch middleware as
  they are, so the plugin should work with it once the peer range allows it.

## Decisions

- Rendering is done in fetch middleware rather than in new commands, so every existing command, `robots.txt`,
  `maxPages`, slots and events work unchanged.
- `render()` passes its options to the middleware through `AsyncLocalStorage`. `FetchRequest` has no field for
  per-request data, and the store follows the async calls from the step into `fetchPage()`, separately per branch.
- One browser context per proxy and user agent, so a slot's proxy and user agent apply, and contexts stay bounded
  across runs.
- `waitFor` and `actions` are skipped for non-2xx and non-HTML responses, which osmotic discards anyway.
- `playwright` and `osmotic` are peer dependencies; Playwright is loaded with `import()` when the browser first starts.
- A working prototype, with JavaScript tests against the build, existed before this repository and workflow. The tests
  were rewritten in TypeScript against `src/` for the layout in CLAUDE.md, committed before the code, and run without
  the code to see them fail.
- In the prototype, two tests expected `undefined` for a selector that matched nothing in an unrendered page. That was
  wrong: osmotic's text specs return `''` when nothing matches. The tests now expect `''`.
- The build goes to `dist/` instead of `distribution/` (prompt 3); CLAUDE.md is updated to match.

## Verification

## Follow-ups

- Widen the `osmotic` peer range to `^2.1.0 || ^3.0.0` once osmotic 3.0.0 is published.
- osmotic still builds to `dist/` with a single `tsconfig.json`; its CLAUDE.md layout section says `distribution/`.
