import { AsyncLocalStorage } from 'node:async_hooks';
import type { FetchMiddleware, FetchNext, FetchRequest, OsmoticPlugin } from 'osmotic';
import type { PlaywrightPluginOptions, RenderOptions } from '../types/options.js';
import { BrowserPool } from './BrowserPool.js';

// Render settings for a branch of the chain
interface Settings extends RenderOptions {
	enabled: boolean;
}

/** Create the plugin, with `options` as the defaults for every page. */
export function createPlugin(options: PlaywrightPluginOptions = {}): OsmoticPlugin {
	const { renderAll = true, browserType, launch, context, ...defaults } = options;
	const pool = new BrowserPool({ browserType, launch, context });
	// render() steps hand their settings to the requests below them through this store.
	// It follows the async calls from the step into osmotic's fetchPage() and so into
	// the middleware, and branches each get their own.
	const store = new AsyncLocalStorage<Settings>();
	const settings = (): Settings => store.getStore() ?? { ...defaults, enabled: renderAll };

	const middleware: FetchMiddleware = Object.assign(
		(req: FetchRequest, next: FetchNext) => {
			const current = settings();
			return current.enabled ? pool.render(req, current) : next(req);
		},
		{ onStart: () => pool.open(), onEnd: () => pool.close() },
	);

	return {
		name: 'osmotic-plugin-playwright',
		commands: {
			render: (opts: RenderOptions | false = {}) => {
				const update = opts === false ? { enabled: false } : { ...opts, enabled: true };
				return (ctx, next) => store.run({ ...settings(), ...update }, () => next(ctx));
			},
		},
		fetch: [middleware],
	};
}
