# feature/outer-middleware

## Prompts

1. Working in osmotic-plugin-awswaf-solver, which solves AWS WAF challenges in fetch middleware. Its user loads both
   plugins in one chain (Playwright first) against an AWS WAF site.

   > This plugin works, but as soon as it's combined with osmotic-plugin-playwright it stops working

2. Claude found that this plugin never calls `next()`, so the solver loaded after it never runs, and that loading the
   solver first doesn't help either: the Response this plugin returns has only `content-type`, so the solver can't see
   `x-amzn-waf-action`, and the `Cookie` header with the solved token is sent as a raw extra header instead of a
   cookie. Headless Chromium can't pass the challenge itself (AWS answers it with a captcha). Claude proposed changing
   this plugin, and asked whether to start. The user explained why the solver failed for Claude without a browser:

   > Oh right... When I wasn't using playwright, I had to set these headers for it to work: (a set of Chrome request
   > headers: `user-agent`, `accept`, `sec-ch-ua*`, `sec-fetch-*`, `accept-language`, `upgrade-insecure-requests`,
   > `priority`)

   With them, Claude confirmed that a token from the solver, set as a cookie in Chromium, loads the real page.

3. Claude noted the user's scraper selector matched nothing on the page. The user explained why plain fetch isn't an
   option:

   > You're right about the selector. It's fixed now, but it doesn't change the fact that using only fetch returns a
   > body that isn't hydrated

4. The branch was done, with a hardcoded check for AWS WAF's `x-amzn-waf-action` header that returned those responses
   unrendered. Claude reported it and asked whether to push and open the pull request.

   > Did you just add WAF- related code into the Playwright plugin?
   >
   > Was that absolutely necessary?

5. Claude said it wasn't: something has to tell the plugin which responses to return as sent, but a generic option
   can, such as `passThrough: (res) => 'x-amzn-waf-action' in res.headers` set by the user. Claude asked whether to
   replace the hardcoded check with it.

   > yeah, I prefer the passthrough idea. I don't want cross- plugin clutter.

## Interpretation

Make the plugin work with fetch middleware loaded before it (plugins loaded earlier, and the chain's own `useFetch`),
so a middleware that reacts to responses and adds cookies, such as the AWS WAF solver, can sit in front of the browser:

- The Response it returns carries the page's real response headers, not just `content-type`.
- A `Cookie` header in the request is set as cookies for the page's URL in the browser context, so the page and its
  own requests to that site send them like a browser would, and other sites don't get them.
- A new render option, `passThrough`, picks responses to return as the server sent them: right away, with the raw
  body and headers, without waiting for the page to load, `waitFor` or `actions`. Middleware in front can then handle
  responses such as an AWS WAF challenge before the page's own scripts act on them.
- The plugin knows nothing about AWS WAF or any other plugin: no vendor header names in its code. Which responses pass
  through is the user's configuration, and the solver doesn't export a helper for it either.

## Type

Feature

## Breaking change

No. Responses gain headers they didn't have. A `Cookie` header from osmotic's `headers` option was sent with every
request the page made, to every site; it is now sent only to the site of the page, as a cookie, which is what a
cookie means.

## Version bump

Minor (1.1.0)

## Scope

In:

- Response headers on the returned Response, minus those that describe the original body (`content-length`,
  `content-encoding`, `transfer-encoding`), since the body is the rendered HTML. Repeated headers such as `set-cookie`
  are kept separately.
- `Cookie` request header to context cookies for the request URL.
- The `passThrough` render option: responses it matches, any status, return with the server's body.
- README: middleware in front of the plugin, `passThrough`, and the AWS WAF solver as an example of both.

Out:

- Detecting any bot protection in the plugin itself.
- Any change to the AWS WAF solver; its README and an integration test follow in its own repo.

## Acceptance criteria

- [x] Middleware in front of the plugin sees the page's response headers, such as a custom header, and each
      `set-cookie` header separately.
- [x] `content-length` from the server isn't copied to the rendered response.
- [x] A `Cookie` header added by middleware in front of the plugin reaches the server as a cookie on the page request
      and on a request the page's script makes to the same site, and not on a request to another site.
- [x] A 2xx response that `passThrough` matches is returned with the server's raw body (not the DOM after its scripts
      ran) and without waiting for `waitFor`.
- [x] A non-2xx response that `passThrough` matches is returned with its body and headers.
- [x] `passThrough` is called with the response's URL, status, and headers with lowercase names.
- [x] Without `passThrough`, a response with `x-amzn-waf-action` is rendered like any other page: the plugin has no
      vendor-specific handling.
- [x] Pages `passThrough` doesn't match still wait for `waitUntil` and `waitFor` as before (covered by the existing
      tests in `render.ts` and `responses.ts`).
- [x] `passThrough` is accepted as a plugin option and by `render()`, and its argument is typed (`test-d/`).

## Affected public API

- Added: render option `passThrough?: (response: PassThroughResponse) => boolean`, also a plugin option, and the
  exported type `PassThroughResponse` (`{ url, status, headers }`).
- The Response passed to middleware in front of the plugin has more headers, and the `Cookie` header is handled as
  cookies.

## Impact on the rest of the codebase

- Checked: callers of `pageResponse()` (only `BrowserPool.render()`); every use of the request headers in
  `BrowserPool` (`setExtraHTTPHeaders`, the context key on proxy and user agent); the `timeout` option's doc comment
  and README row; the README sections on how the plugin works and on osmotic options in the browser; `examples/`; the
  existing tests, all of which pass unchanged. For `passThrough`: how plugin options reach render settings
  (`plugin.ts` spreads them into the defaults, so it works as a plugin option without changes there), both entry
  points' type exports, and a search of `src/`, `README.md` and `CHANGELOG.md` for `waf`, which finds nothing.
- Found:
  - A `Cookie` in osmotic's `headers` option was sent to every site the page loaded from; it now goes only to the
    page's site, and is stored in the shared context, so later pages with the same proxy and user agent send it too,
    as a browser would. README updated.
  - `timeout` now applies to the response and to `waitUntil` separately, so a slow page can take up to twice as long
    before `waitFor` starts. README and doc comment updated.
  - Non-2xx and non-HTML responses now return as soon as the response arrives, instead of after `load`.

## Decisions

- Navigation runs to `commit`, then waits for `waitUntil` with `waitForLoadState`, so the response headers are known
  before the page's scripts run long enough to reload a challenge page. `waitUntil: 'commit'` skips the second wait.
- The `content-length` test passed before the code existed, since no headers were copied then. It stays: it guards
  against the header copying this branch adds, which would otherwise copy a length that doesn't match the rendered
  HTML.
- Cookies are set for the URL's origin root, so they apply to every path on the host, as the header did. They are
  host-only: a cookie AWS WAF scopes to the parent domain (such as `imdb.com` for `www.imdb.com`) doesn't reach other
  subdomains. The header doesn't say which domain a cookie was meant for.
- Prettier reformatted `test/middleware.ts` after the tests were committed; only line breaks changed.
- The two AWS WAF tests are replaced, not because they were wrong for the criteria at the time, but because prompt 5
  changed the criteria: the plugin must not recognise `x-amzn-waf-action`. Their replacements use a neutral header
  matched by `passThrough`, and a new test checks that `x-amzn-waf-action` alone no longer changes anything.
- `passThrough` gets a plain object rather than Playwright's `Response`, so a predicate doesn't depend on Playwright's
  types and works the same for any browser type.
- The 1.1.0 release commit (version and changelog) and the removal of `PLAN.md` were made before prompt 4. The plan is
  restored while work continues; the changelog entry is rewritten for `passThrough`, and the plan is removed again
  before merging.

## Verification

- `npm test`: all 22 tests pass, the seven in `test/middleware.ts` included, and the type tests in `test-d/` compile.
  Before the header and cookie code, three of the first five failed and the `content-length` one passed (see
  Decisions); before the `passThrough` code, its four tests failed and the type tests didn't compile.
- `npx prettier --check .` passes.
- Against imdb.com, by hand, since tests don't use real sites: a chain loading osmotic-plugin-awswaf-solver and then
  this plugin's build with `passThrough: (res) => 'x-amzn-waf-action' in res.headers`, with a Chrome user agent and
  `respectRobots: false`, fetched `/interest/all/` with status 200 and 728 links from the rendered page. Without the
  solver in front, the same chain got AWS WAF's challenge page, and headless Chromium solving it by itself was
  answered with a captcha.

## Follow-ups

- osmotic-plugin-awswaf-solver: document loading it before this plugin with the `passThrough` setting above (needs
  this release, 1.1.0), and add an integration test with both.
