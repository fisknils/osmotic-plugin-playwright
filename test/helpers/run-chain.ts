import type { Osmotic, OsmoticEvents } from 'osmotic';

/** What a run produced: the data rows reaching the end of the chain, and its events. */
export interface RunResult {
	rows: Record<string, unknown>[];
	pages: OsmoticEvents['page'][];
	skips: OsmoticEvents['skip'][];
	errors: OsmoticEvents['error'][];
}

/** Run `chain` with `robots.txt` ignored, and collect its rows and events. */
export async function runChain(chain: Osmotic): Promise<RunResult> {
	const result: RunResult = { rows: [], pages: [], skips: [], errors: [] };
	await chain
		.on('page', (e) => result.pages.push(e))
		.on('skip', (e) => result.skips.push(e))
		.on('error', (e) => result.errors.push(e))
		.data((d) => result.rows.push(d))
		.config({ respectRobots: false })
		.run();
	return result;
}

/** An HTML page whose body is empty until `script` runs. */
export const scripted = (script: string): string => `<!doctype html><body><script>${script}</script></body>`;
