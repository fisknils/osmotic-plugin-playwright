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

- [ ] Middleware in front of the plugin sees the page's response headers, such as a custom header, and each
      `set-cookie` header separately.
- [ ] `content-length` from the server isn't copied to the rendered response.
- [ ] A `Cookie` header added by middleware in front of the plugin reaches the server as a cookie on the page request
      and on a request the page's script makes to the same site, and not on a request to another site.
- [ ] A 2xx response with `x-amzn-waf-action` is returned with the server's raw body (not the DOM after its scripts
      ran) and without waiting for `waitFor`.
- [ ] A non-2xx response with `x-amzn-waf-action` (a captcha is 405) is returned with its body and headers.
- [ ] Pages without `x-amzn-waf-action` still wait for `waitUntil` and `waitFor` as before (covered by the existing
      tests in `render.ts` and `responses.ts`).

## Affected public API

No new options or types. The Response passed to middleware in front of the plugin has more headers, and the `Cookie`
header is handled as cookies.

## Impact on the rest of the codebase

- Checked:
- Found:

## Decisions

- Navigation runs to `commit`, then waits for `waitUntil` with `waitForLoadState`, so the response headers are known
  before the page's scripts run long enough to reload a challenge page. `waitUntil: 'commit'` skips the second wait.

## Verification

## Follow-ups

- osmotic-plugin-awswaf-solver: document loading it before this plugin, and add an integration test with both.
