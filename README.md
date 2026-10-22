# osmotic-plugin-playwright

An [osmotic](https://www.npmjs.com/package/osmotic) plugin that loads pages in a real
browser with [Playwright](https://playwright.dev/). Content that a page builds with
JavaScript is in the HTML osmotic parses, so `find()`, `set()` and the rest work on
single-page apps and other script-heavy sites.

```js
const { Osmotic } = require('osmotic');

Osmotic.plugins([require('osmotic-plugin-playwright')]);

Osmotic.get('https://quotes.toscrape.com/js/')
	.recurse('li.next a@href')
	.find('.quote')
	.set({ text: '.text', author: '.author', tags: ['.tag'] })
	.csv('quotes.csv')
	.run();
```

- Every page is rendered by default; nothing else in the chain changes
- `robots.txt`, `Crawl-delay`, `maxPages`, concurrency and events work as before
- Per-slot proxies, user agents and headers are applied in the browser
- Wait for selectors, click and scroll before the HTML is captured
- Block images, fonts and other resources to load pages faster
- One shared browser, launched when first needed and closed when the run ends

## Installation

```sh
npm install osmotic osmotic-plugin-playwright playwright
npx playwright install chromium
```

`osmotic` (version 2 or 3) and `playwright` are peer dependencies, so install them
alongside the plugin. The second command downloads the browser.

## Usage

Load the plugin once, before building any chains:

```js
// CommonJS
const { Osmotic } = require('osmotic');
Osmotic.plugins([require('osmotic-plugin-playwright')]);

// ES modules / TypeScript
import { Osmotic } from 'osmotic';
import playwright from 'osmotic-plugin-playwright';
Osmotic.plugins([playwright]);
```

To pass [options](#options), call the plugin with them:

```js
Osmotic.plugins([require('osmotic-plugin-playwright')({ block: ['image', 'font'] })]);
```

### How it works

The plugin adds fetch middleware. Instead of making the HTTP request, it opens the URL
in a new browser page, waits for it to load, and gives osmotic the rendered HTML
(`page.content()`) as the response. osmotic then parses it as usual.

The response keeps the page's real status and headers, so non-2xx pages and non-HTML
responses are skipped as before, and the `page` event reports the URL after redirects.
Headers that describe the original body, such as `Content-Length` and
`Content-Encoding`, are left out, since the body is the rendered HTML. Navigation errors
and timeouts are reported as `error` events.

`robots.txt` is still fetched directly, without the browser.

### Middleware in front of the plugin

The plugin makes the request itself and doesn't call `next()`, so fetch middleware loaded
after it never runs. Middleware that needs to see or change requests must come before
it: load its plugin first, or add it with the chain's `useFetch()`.

- Headers it adds are sent by the browser. A `Cookie` header is set as cookies for the
  page's site in the browser context, so the page's own requests to that site send them
  too, and other sites don't.
- It sees the page's response headers, `Set-Cookie` once per cookie.
- Responses it handles itself, such as a challenge it solves, can be returned to it
  unrendered with [`passThrough`](#render-options).

```js
Osmotic.plugins([
	require('some-middleware-plugin'),
	require('osmotic-plugin-playwright')({
		passThrough: (res) => res.headers['x-challenge'] === '1',
	}),
]);
```

## Commands

### `.render(options = {})`

Sets [render options](#render-options) for the pages loaded **after** this step, on
top of the plugin's options and any earlier `render()`. It also turns rendering on for
those pages when the plugin was loaded with `renderAll: false`.

```js
new Osmotic().render({ waitFor: '.price' }).get('https://example.com/product/1').set({ price: '.price' }).run();
```

`Osmotic.get(url)` loads its page before any `render()` step can run, so start the chain
with `new Osmotic().render(...)` when the first page needs options.

Options apply to the branch they're set on, including pages loaded by `follow()` and
`recurse()`:

```js
new Osmotic()
	.render(false) // the listing is plain HTML
	.get('https://example.com/products')
	.render({ waitFor: '.price' })
	.follow('.product a@href') // product pages are rendered
	.set({ title: 'h1', price: '.price' })
	.run();
```

### `.render(false)`

Fetches the pages loaded after this step without the browser, as plain osmotic would.

## Render options

These can be set when loading the plugin, as defaults for every page, and with
`render()`.

| Option        | Default  | Description                                                                                   |
| ------------- | -------- | --------------------------------------------------------------------------------------------- |
| `waitUntil`   | `'load'` | When navigation is done: `'load'`, `'domcontentloaded'`, `'networkidle'` or `'commit'`.       |
| `waitFor`     | none     | Wait until an element matching this selector is in the page.                                  |
| `timeout`     | `30000`  | Milliseconds for the response, again for `waitUntil`, and again for `waitFor`.                |
| `block`       | `[]`     | Resource types to abort, such as `'image'`, `'font'`, `'media'` or `'stylesheet'`.            |
| `actions`     | none     | `async (page, url) => {}`, run before the HTML is captured. `page` is Playwright's `Page`.    |
| `passThrough` | none     | `({ url, status, headers }) => boolean`. Matching responses are returned as sent, unrendered. |

`waitFor` and `actions` only run for 2xx HTML responses. A response `passThrough` matches
is returned as soon as it arrives, with the server's body and headers, whatever its
status: no `waitUntil`, `waitFor` or `actions`, and the page's scripts don't get to change
it. `headers` has lowercase names. `waitFor` takes a Playwright
selector, so besides CSS it also accepts forms like `text=Next`. osmotic's own selector
extras, such as `:text-is()`, are not available there.

`actions` can do anything Playwright can before the page is parsed:

```js
.render({
	actions: async (page) => {
		await page.click('text=Load more');
		await page.waitForSelector('.item:nth-child(40)');
	},
})
```

## Options

The plugin's own options, alongside the [render options](#render-options):

| Option        | Default                   | Description                                                                        |
| ------------- | ------------------------- | ---------------------------------------------------------------------------------- |
| `renderAll`   | `true`                    | Render every page. When `false`, only pages after a `render()` step are.           |
| `browserType` | `chromium` (`playwright`) | The browser to launch, e.g. `firefox` or `webkit`, or one from `playwright-extra`. |
| `launch`      | `{ headless: true }`      | Playwright launch options, e.g. `{ headless: false, slowMo: 250 }`.                |
| `context`     | `{}`                      | Playwright browser context options, e.g. `viewport`, `locale` or `timezoneId`.     |

```js
const { firefox } = require('playwright');

Osmotic.plugins([
	require('osmotic-plugin-playwright')({
		browserType: firefox,
		launch: { headless: false },
		context: { locale: 'sv-SE', viewport: { width: 1280, height: 800 } },
		waitUntil: 'networkidle',
	}),
]);
```

## osmotic options in the browser

| osmotic option         | In the browser                                                              |
| ---------------------- | --------------------------------------------------------------------------- |
| `userAgent`            | The context's user agent, so `navigator.userAgent` matches the header.      |
| `headers`              | Sent with every request the page makes. `Cookie` goes to the page's site.   |
| `slots[].proxy`        | The context's proxy. Credentials in the URL (`http://user:pass@host`) work. |
| `concurrency`, `slots` | One browser page per slot at most, so they limit open pages too.            |
| `delay`, `maxPages`    | As before: they apply to page loads, not to the requests a page makes.      |

The plugin keeps one browser context per proxy and user agent, so cookies and storage
persist across pages loaded with the same settings, as in a normal browser session.
Settings in the plugin's `context` option take precedence over osmotic's.

osmotic's default user agent, `osmotic/0.1`, is sent by the browser too. Some sites
treat unknown user agents differently; set `userAgent` if pages don't render as they
do in your own browser.

## The browser

One browser is shared by every chain. It is launched on the first rendered request,
so a run that renders nothing never starts it, and closed when the last running chain
finishes. If the browser crashes, the next request launches a new one.

Rendering is much slower than plain fetching, and every page uses memory in the browser.
Keep `concurrency` modest, block resources you don't need, and use `renderAll: false`
with `render()` when only some pages need JavaScript.

## TypeScript

Type declarations are included. Loading the package's types also declares `render()` on
`Osmotic`. The options types are exported:

```ts
import playwright, { type PlaywrightPluginOptions, type RenderOptions } from 'osmotic-plugin-playwright';
```

## Development

```sh
npm run build          # clean dist/ and compile src/ with tsc
npm test               # build, type check test-d/, and run the tests in test/
npm run format         # format everything with Prettier
```

The tests use `node:test`, run against `src/` through `tsx`, serve their pages from a
local HTTP server, and need Chromium: `npx playwright install chromium`. Type tests in
`test-d/` are compiled, never run.

| File                              | Responsibility                                          |
| --------------------------------- | ------------------------------------------------------- |
| `src/index.cts` / `src/index.mts` | CommonJS and ESM entry points                           |
| `src/core/plugin.ts`              | The plugin: middleware, `render()` command, settings    |
| `src/core/BrowserPool.ts`         | Shared browser, contexts and page rendering             |
| `src/types/options.ts`            | Options types and the `render()` declaration            |
| `src/utils/`                      | Helpers: proxy settings, header names, the `Response`   |
| `test/`, `test/helpers/`          | Runtime tests, one file per behavior, and test fixtures |
| `test-d/`                         | Type tests                                              |

Examples are in [`examples/`](examples/).

## License

ISC
