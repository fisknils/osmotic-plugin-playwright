import type { BrowserContextOptions } from 'playwright';

/** Playwright's proxy setting for a proxy URL. Playwright takes credentials separately from the server. */
export function proxyServer(url: string): NonNullable<BrowserContextOptions['proxy']> {
	const u = new URL(url);
	const server = `${u.protocol}//${u.host}`;
	if (!u.username) return { server };
	return { server, username: decodeURIComponent(u.username), password: decodeURIComponent(u.password) };
}
