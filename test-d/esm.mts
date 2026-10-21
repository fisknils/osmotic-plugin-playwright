// The ESM entry point, as an ES module caller sees it
import { Osmotic } from 'osmotic';
import playwright, { type PlaywrightPluginOptions, type RenderOptions } from '../src/index.mjs';

const options: PlaywrightPluginOptions = { waitUntil: 'domcontentloaded' };
const render: RenderOptions = { waitFor: '.item' };

Osmotic.plugins([playwright, playwright(options)]);
new Osmotic().render(render).get('https://example.com');

// @ts-expect-error: timeout is a number
playwright({ timeout: '5s' });
