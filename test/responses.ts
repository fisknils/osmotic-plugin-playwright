import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Osmotic } from 'osmotic';
import playwright from '../src/index.cjs';
import { createSite, runChain, scripted, type Site } from './helpers/index.js';

let site: Site;

before(async () => {
	site = await createSite({
		'/redirect': { redirect: '/target' },
		'/target': scripted(`document.body.insertAdjacentHTML('beforeend', '<a href="next">next</a>')`),
		'/gone': { status: 410, body: '<p>gone</p>' },
		'/data.json': { type: 'application/json', body: '{"a":1}' },
		'/page': '<p>page</p>',
	});
	Osmotic.plugins([playwright]);
});

after(() => site.close());

test('the page event reports the URL after redirects, and links resolve against it', async () => {
	const { rows, pages } = await runChain(Osmotic.get(site.url('/redirect')).set({ link: 'a@href' }));
	assert.deepEqual(
		pages.map((p) => [p.url, p.requestedUrl]),
		[[site.url('/target'), site.url('/redirect')]],
	);
	assert.deepEqual(rows, [{ link: site.url('/next') }]);
});

test('non-2xx responses are skipped without waiting for waitFor', async () => {
	const chain = new Osmotic().render({ waitFor: '.never', timeout: 5000 }).get(site.url('/gone'));
	const started = Date.now();
	const { skips, errors } = await runChain(chain);
	assert.deepEqual(skips, [{ url: site.url('/gone'), reason: 'status', status: 410 }]);
	assert.deepEqual(errors, []);
	assert.ok(Date.now() - started < 5000);
});

test('non-HTML responses are skipped', async () => {
	const { skips } = await runChain(Osmotic.get(site.url('/data.json')));
	assert.deepEqual(skips, [{ url: site.url('/data.json'), reason: 'contentType', status: 200 }]);
});

test('a waitFor timeout is reported as an error event', async () => {
	const chain = new Osmotic().render({ waitFor: '.never', timeout: 300 }).get(site.url('/page'));
	const { rows, errors } = await runChain(chain);
	assert.deepEqual(rows, []);
	assert.deepEqual(
		errors.map((e) => e.url),
		[site.url('/page')],
	);
});
