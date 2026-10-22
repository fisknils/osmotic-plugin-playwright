// ESM entry: re-exports the CommonJS build, so import and require share one plugin
import playwright from './index.cjs';

export default playwright;
export type { PassThroughResponse, PlaywrightPluginOptions, RenderOptions } from './types/options.js';
