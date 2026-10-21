import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Osmotic } from 'osmotic';
import playwright from '../src/index.cjs';
import { createSite, runChain, scripted, type Site } from './helpers/index.js';

let site: Site;

before(async () => {
	site = await createSite({
		'/': scripted(`document.body.insertAdjacentHTML('beforeend', '<p class="ua">' + navigator.userAgent + '</p>')`),
	});
	Osmotic.plugins([playwright]);
});

after(() => site.close());

test("osmotic's userAgent and headers are sent by the browser", async () => {
	const chain = Osmotic.get(site.url('/'))
		.set({ ua: '.ua' })
		.config({ userAgent: 'test-agent/1.0', headers: { 'X-Test': 'yes' } });
	const { rows } = await runChain(chain);
	const [request] = site.requests.filter((r) => r.path === '/');
	assert.equal(request.headers['user-agent'], 'test-agent/1.0');
	assert.equal(request.headers['x-test'], 'yes');
	assert.deepEqual(rows, [{ ua: 'test-agent/1.0' }]); // navigator.userAgent matches the header
});
