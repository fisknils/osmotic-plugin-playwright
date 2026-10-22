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

## Interpretation

Make the plugin work with fetch middleware loaded before it (plugins loaded earlier, and the chain's own `useFetch`),
so a middleware that reacts to responses and adds cookies, such as the AWS WAF solver, can sit in front of the browser:

- The Response it returns carries the page's real response headers, not just `content-type`.
- A `Cookie` header in the request is set as cookies for the page's URL in the browser context, so the page and its
  own requests to that site send them like a browser would, and other sites don't get them.
- A response carrying `x-amzn-waf-action` (an AWS WAF challenge or captcha) is returned right away with its raw body,
  without waiting for the page to load, `waitFor` or `actions`, so the middleware in front can solve it before the
  challenge's own script reloads the page.

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
- Early return for responses with `x-amzn-waf-action`, any status, with the server's body.
- README: middleware in front of the plugin, and loading order with the AWS WAF solver.

Out:

- Detecting other bot protections. Only AWS WAF's header is known to be needed; others can be added when a solver needs
  them.
- Any change to the AWS WAF solver; its README and an integration test follow in its own repo.

## Acceptance criteria

- [x] Middleware in front of the plugin sees the page's response headers, such as a custom header, and each
      `set-cookie` header separately.
- [x] `content-length` from the server isn't copied to the rendered response.
- [x] A `Cookie` header added by middleware in front of the plugin reaches the server as a cookie on the page request
      and on a request the page's script makes to the same site, and not on a request to another site.
- [x] A 2xx response with `x-amzn-waf-action` is returned with the server's raw body (not the DOM after its scripts
      ran) and without waiting for `waitFor`.
- [x] A non-2xx response with `x-amzn-waf-action` (a captcha is 405) is returned with its body and headers.
- [x] Pages without `x-amzn-waf-action` still wait for `waitUntil` and `waitFor` as before (covered by the existing
      tests in `render.ts` and `responses.ts`).

## Affected public API

No new options or types. The Response passed to middleware in front of the plugin has more headers, and the `Cookie`
header is handled as cookies.

## Impact on the rest of the codebase

- Checked: callers of `pageResponse()` (only `BrowserPool.render()`); every use of the request headers in
  `BrowserPool` (`setExtraHTTPHeaders`, the context key on proxy and user agent); the `timeout` option's doc comment
  and README row; the README sections on how the plugin works and on osmotic options in the browser; `examples/`; the
  existing tests, all of which pass unchanged.
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

## Verification

- `npm test`: every test passes, the five new ones in `test/middleware.ts` included. Before the code, four of them
  failed and the `content-length` one passed (see Decisions).
- `npx prettier --check .` passes.
- Against imdb.com, by hand, since tests don't use real sites: a chain loading osmotic-plugin-awswaf-solver and then
  this plugin's build, with a Chrome user agent and `respectRobots: false`, fetched `/interest/all/` with status 200
  and the rendered page's links. Without the solver in front, the same chain got AWS WAF's challenge page, and
  headless Chromium solving it by itself was answered with a captcha.

## Follow-ups

- osmotic-plugin-awswaf-solver: document loading it before this plugin, and add an integration test with both.
