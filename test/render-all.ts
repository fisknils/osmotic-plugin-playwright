import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Osmotic } from 'osmotic';
import playwright from '../src/index.cjs';
import { createSite, runChain, scripted, type Site } from './helpers/index.js';

const page = scripted(`document.body.insertAdjacentHTML('beforeend', '<p class="msg">rendered</p>')`);

let site: Site;

before(async () => {
	// Each URL is fetched once per run, so the second load needs its own path
	site = await createSite({ '/first': page, '/second': page });
	Osmotic.plugins([playwright({ renderAll: false })]);
});

after(() => site.close());

test('with renderAll: false, only pages loaded after a render() step are rendered', async () => {
	const chain = new Osmotic()
		.get(site.url('/first'))
		.set({ before: '.msg' })
		.render()
		.get(site.url('/second'))
		.set({ after: '.msg' });
	const { rows } = await runChain(chain);
	assert.deepEqual(rows, [{ before: '', after: 'rendered' }]);
});
