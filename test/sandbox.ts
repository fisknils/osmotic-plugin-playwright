import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Osmotic } from 'osmotic';
import { chromium, type BrowserType, type LaunchOptions } from 'playwright';
import playwright from '../src/index.cjs';
import { createSite, runChain, scripted, type Site } from './helpers/index.js';

let site: Site;
const launches: (LaunchOptions | undefined)[] = [];

// Chromium, recording the options of every launch
const browserType = {
	launch: (options) => {
		launches.push(options);
		return chromium.launch(options);
	},
} as BrowserType;

before(async () => {
	site = await createSite({ '/': scripted(`document.body.innerHTML = '<p>rendered</p>'`) });
	Osmotic.plugins([playwright({ browserType })]);
});

after(() => site.close());

test('the browser is launched with the Chromium sandbox by default, and pages render', async () => {
	const { rows, errors } = await runChain(Osmotic.get(site.url('/')).set({ text: 'p' }));
	assert.deepEqual(errors, []);
	assert.deepEqual(rows, [{ text: 'rendered' }]);
	assert.equal(launches.length, 1);
	assert.equal(launches[0]?.chromiumSandbox, true);
});
