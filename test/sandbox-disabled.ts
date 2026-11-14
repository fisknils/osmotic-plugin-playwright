import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Osmotic } from 'osmotic';
import { chromium, type BrowserType, type LaunchOptions } from 'playwright';
import playwright from '../src/index.cjs';
import { createSite, runChain, type Site } from './helpers/index.js';

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
	site = await createSite({ '/': '<p>a</p>' });
	Osmotic.plugins([playwright({ browserType, launch: { chromiumSandbox: false } })]);
});

after(() => site.close());

test('launch: { chromiumSandbox: false } launches the browser without the sandbox', async () => {
	const { errors } = await runChain(Osmotic.get(site.url('/')));
	assert.deepEqual(errors, []);
	assert.equal(launches.length, 1);
	assert.equal(launches[0]?.chromiumSandbox, false);
});
