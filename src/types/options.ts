import type { BrowserContextOptions, BrowserType, LaunchOptions, Page } from 'playwright';

// Declared next to the options it takes. Both entry points' declarations import this
// file, so callers get render() on Osmotic as soon as they import the plugin.
declare module 'osmotic' {
	interface Osmotic {
		/**
		 * Set how pages loaded after this step are rendered, on top of the plugin's
		 * options and earlier `render()` steps. `render(false)` fetches them without
		 * the browser instead.
		 *
		 * @example
		 * ```ts
		 * new Osmotic()
		 * 	.render({ waitFor: '.price' })
		 * 	.get('https://example.com/product')
		 * 	.set({ price: '.price' });
		 * ```
		 */
		render(options?: RenderOptions | false): this;
	}
}

/** How a page is loaded and when its HTML is captured. */
export interface RenderOptions {
	/**
	 * When navigation counts as finished.
	 * @defaultValue `'load'`
	 */
	waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit';
	/** Wait until an element matching this selector is in the page. */
	waitFor?: string;
	/**
	 * Milliseconds to allow for the response, for `waitUntil` and for `waitFor`, each.
	 * @defaultValue Playwright's default, `30000`
	 */
	timeout?: number;
	/**
	 * Resource types to abort instead of loading, such as `'image'`, `'font'`,
	 * `'media'` or `'stylesheet'`.
	 * @defaultValue `[]`
	 */
	block?: string[];
	/**
	 * Runs after the page loads and `waitFor` matched, before the HTML is captured.
	 * Use it to click, scroll or fill in forms. Only called for 2xx HTML responses.
	 */
	actions?: (page: Page, url: string) => unknown;
	/**
	 * Return the responses this matches as the server sent them, without rendering: right
	 * away, with the raw body, without waiting for `waitUntil`, `waitFor` or `actions`.
	 * For fetch middleware in front of the plugin that handles such responses itself.
	 */
	passThrough?: (response: PassThroughResponse) => boolean;
}

/** The response {@link RenderOptions.passThrough} decides on. */
export interface PassThroughResponse {
	/** The URL after redirects. */
	url: string;
	status: number;
	/** Response headers, with lowercase names. */
	headers: Record<string, string>;
}

/** Options for the plugin. Render options set here are the defaults for every page. */
export interface PlaywrightPluginOptions extends RenderOptions {
	/**
	 * Render every page. When `false`, only pages loaded after a `render()` step are rendered,
	 * and others are fetched as usual.
	 * @defaultValue `true`
	 */
	renderAll?: boolean;
	/**
	 * The browser to launch, such as `firefox` from `playwright`, or `chromium` from
	 * `playwright-extra`.
	 * @defaultValue `chromium` from `playwright`
	 */
	browserType?: BrowserType;
	/**
	 * Options for launching the browser.
	 * @defaultValue `{ headless: true }`
	 */
	launch?: LaunchOptions;
	/**
	 * Options for each browser context. They take precedence over the user agent and
	 * proxy from osmotic's options.
	 */
	context?: BrowserContextOptions;
}
