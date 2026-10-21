import type { Browser, BrowserContext } from 'playwright';
import type { FetchRequest } from 'osmotic';
import type { PlaywrightPluginOptions, RenderOptions } from '../types/options.js';
import { defaultBrowserType } from '../utils/default-browser-type.js';
import { lowercaseKeys } from '../utils/lowercase-keys.js';
import { pageResponse } from '../utils/page-response.js';
import { proxyServer } from '../utils/proxy-server.js';

// A launched browser and its contexts, one per proxy and user agent
interface Session {
	browser: Browser;
	contexts: Map<string, Promise<BrowserContext>>;
}

// A browser shared by every run that uses the plugin. It is launched on the first
// rendered request and closed when the last active run ends.
export class BrowserPool {
	private runs = 0;
	private session: Promise<Session> | null = null;

	constructor(private readonly opts: Pick<PlaywrightPluginOptions, 'browserType' | 'launch' | 'context'>) {}

	open(): void {
		this.runs++;
	}

	async close(): Promise<void> {
		this.runs = Math.max(0, this.runs - 1);
		if (this.runs || !this.session) return;
		const session = this.session;
		this.session = null;
		const launched = await session.catch(() => null);
		await launched?.browser.close();
	}

	// Load req.url in a new page and return the rendered HTML as a Response
	async render(req: FetchRequest, options: RenderOptions): Promise<Response> {
		const { 'user-agent': userAgent, ...headers } = lowercaseKeys(req.headers);
		const session = await this.launched();
		const context = await this.context(session, req.slot.proxy, userAgent);
		const page = await context.newPage();
		try {
			if (Object.keys(headers).length) await page.setExtraHTTPHeaders(headers);
			const block = options.block ?? [];
			if (block.length) {
				await page.route('**/*', (route) =>
					block.includes(route.request().resourceType()) ? route.abort() : route.continue(),
				);
			}
			const res = await page.goto(req.url, { waitUntil: options.waitUntil ?? 'load', timeout: options.timeout });
			const status = res?.status() ?? 200;
			const type = res?.headers()['content-type'] ?? 'text/html';
			// osmotic skips these anyway, so don't wait for content that won't come
			if (status < 200 || status > 299 || !type.includes('html')) {
				return pageResponse(null, status, type, page.url());
			}
			if (options.waitFor) {
				await page.waitForSelector(options.waitFor, { state: 'attached', timeout: options.timeout });
			}
			await options.actions?.(page, req.url);
			return pageResponse(await page.content(), status, type, page.url());
		} finally {
			await page.close().catch(() => {});
		}
	}

	private launched(): Promise<Session> {
		if (this.session) return this.session;
		const session = this.launch();
		this.session = session;
		const forget = () => {
			if (this.session === session) this.session = null;
		};
		// A browser that crashed or failed to launch is replaced on the next request
		session.then(({ browser }) => browser.on('disconnected', forget), forget);
		return session;
	}

	private async launch(): Promise<Session> {
		const browserType = this.opts.browserType ?? (await defaultBrowserType());
		const browser = await browserType.launch({ headless: true, ...this.opts.launch });
		return { browser, contexts: new Map() };
	}

	// Contexts are shared by requests with the same proxy and user agent, so cookies
	// persist across those requests like in a regular browser session
	private context(session: Session, proxy: string | undefined, userAgent: string | undefined): Promise<BrowserContext> {
		const key = `${proxy ?? ''} ${userAgent ?? ''}`;
		let context = session.contexts.get(key);
		if (!context) {
			context = session.browser.newContext({
				...(userAgent ? { userAgent } : {}),
				...(proxy ? { proxy: proxyServer(proxy) } : {}),
				...this.opts.context,
			});
			session.contexts.set(key, context);
			context.catch(() => session.contexts.delete(key));
		}
		return context;
	}
}
