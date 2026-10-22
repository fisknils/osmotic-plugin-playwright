// Statuses whose Response must not have a body
const NULL_BODY = new Set([101, 204, 205, 304]);

// Headers that describe the original body, which the rendered HTML replaces
const BODY_HEADERS = new Set(['content-length', 'content-encoding', 'transfer-encoding']);

/**
 * A Response for osmotic. Constructed Responses have no url, so the final URL after
 * redirects is set on the instance; osmotic reports and resolves links against it.
 * `headers` are the page's response headers, repeated ones such as `set-cookie` once each.
 */
export function pageResponse(
	body: string | null,
	status: number,
	type: string,
	url: string,
	headers: { name: string; value: string }[] = [],
): Response {
	const all = new Headers();
	for (const { name, value } of headers) {
		if (!BODY_HEADERS.has(name.toLowerCase())) all.append(name, value);
	}
	all.set('content-type', type);
	const res = new Response(NULL_BODY.has(status) ? null : body, { status, headers: all });
	Object.defineProperty(res, 'url', { value: url });
	return res;
}
