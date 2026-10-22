/**
 * The cookies in a `Cookie` request header, as Playwright cookies for the site of `url`.
 * They apply to every path on that host, as the header did for this request.
 */
export function requestCookies(header: string, url: string): { name: string; value: string; url: string }[] {
	const site = new URL('/', url).href;
	return header
		.split(';')
		.map((c) => c.trim())
		.filter((c) => c.indexOf('=') > 0)
		.map((c) => {
			const i = c.indexOf('=');
			return { name: c.slice(0, i).trim(), value: c.slice(i + 1).trim(), url: site };
		});
}
