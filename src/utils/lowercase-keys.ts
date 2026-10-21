/** A copy of `headers` with lowercase names. */
export function lowercaseKeys(headers: Record<string, string>): Record<string, string> {
	return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
}
