import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Osmotic } from 'osmotic';
import { chromium, type Browser, type BrowserType } from 'playwright';
import playwright from '../src/index.cjs';
import { createSite, runChain, type Site } from './helpers/index.js';

let site: Site;
const launched: Browser[] = [];

// Chromium, recording every browser it launches
const browserType = {
	launch: async (options) => {
		const browser = await chromium.launch(options);
		launched.push(browser);
		return browser;
	},
} as BrowserType;

before(async () => {
	site = await createSite({ '/a': '<p>a</p>', '/b': '<p>b</p>' });
	Osmotic.plugins([playwright({ browserType })]);
});

after(() => site.close());

test('concurrent runs share one browser, and it is closed after the last one ends', async () => {
	await Promise.all([runChain(Osmotic.get(site.url('/a'))), runChain(Osmotic.get(site.url('/b')))]);
	assert.equal(launched.length, 1);
	assert.equal(launched[0].isConnected(), false);
});

test('a later run launches a new browser', async () => {
	await runChain(Osmotic.get(site.url('/a')));
	assert.equal(launched.length, 2);
	assert.equal(launched[1].isConnected(), false);
});
