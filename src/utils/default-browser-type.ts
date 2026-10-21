import type { BrowserType } from 'playwright';

/** Chromium from the `playwright` package, loaded on first use. */
export async function defaultBrowserType(): Promise<BrowserType> {
	try {
		return (await import('playwright')).chromium;
	} catch (err) {
		throw new Error('osmotic-plugin-playwright needs Playwright: npm install playwright', { cause: err });
	}
}
