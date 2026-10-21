import { Osmotic, type OsmoticPlugin } from 'osmotic';
import { firefox } from 'playwright';
import playwright = require('../src/index.cjs');

const options: playwright.PlaywrightPluginOptions = {
	renderAll: false,
	browserType: firefox,
	launch: { headless: false },
	context: { locale: 'sv-SE' },
	block: ['image'],
};

// Loaded as is, or called with options
Osmotic.plugins([playwright, playwright(options), playwright()]);
const plugin: OsmoticPlugin = playwright(options);

// @ts-expect-error: renderAll is a boolean
playwright({ renderAll: 'yes' });

// @ts-expect-error: unknown options are rejected
playwright({ headless: true });
