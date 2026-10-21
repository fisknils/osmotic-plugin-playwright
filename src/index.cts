import type { OsmoticPlugin } from 'osmotic';
import { createPlugin } from './core/plugin.js';
import type * as options from './types/options.js';

/**
 * Render pages with Playwright. Load it once, before building chains:
 *
 * ```js
 * Osmotic.plugins([require('osmotic-plugin-playwright')]);
 * // or, with options:
 * Osmotic.plugins([require('osmotic-plugin-playwright')({ block: ['image'] })]);
 * ```
 */
function playwright(options?: options.PlaywrightPluginOptions): OsmoticPlugin {
	return createPlugin(options);
}

namespace playwright {
	export type PlaywrightPluginOptions = options.PlaywrightPluginOptions;
	export type RenderOptions = options.RenderOptions;
}

// module.exports is the function itself, so require() can pass it straight to plugins()
export = playwright;
