// Statuses whose Response must not have a body
const NULL_BODY = new Set([101, 204, 205, 304]);

/**
 * A Response for osmotic. Constructed Responses have no url, so the final URL after
 * redirects is set on the instance; osmotic reports and resolves links against it.
 */
export function pageResponse(body: string | null, status: number, type: string, url: string): Response {
	const res = new Response(NULL_BODY.has(status) ? null : body, { status, headers: { 'content-type': type } });
	Object.defineProperty(res, 'url', { value: url });
	return res;
}
