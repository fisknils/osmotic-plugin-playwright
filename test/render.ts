import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Osmotic } from 'osmotic';
import playwright from '../src/index.cjs';
import { createSite, runChain, scripted, type Site } from './helpers/index.js';

const addMessage = (cls: string, text: string) =>
	`document.body.insertAdjacentHTML('beforeend', '<p class="${cls}">${text}</p>')`;

let site: Site;

before(async () => {
	site = await createSite({
		'/js': scripted(addMessage('msg', 'rendered')),
		'/late': scripted(`setTimeout(() => ${addMessage('late', 'arrived')}, 300)`),
		'/button': `<button onclick="this.insertAdjacentHTML('afterend', '<p class=clicked>yes</p>')">Go</button>`,
		'/links': '<a href="/js">js</a> <a href="/late">late</a>',
		'/image': '<img src="/pixel.png"><p class="msg">has image</p>',
		'/pixel.png': { type: 'image/png' },
	});
	Osmotic.plugins([playwright]);
});

after(() => site.close());

test('content built by scripts is visible to set()', async () => {
	const { rows } = await runChain(Osmotic.get(site.url('/js')).set({ msg: '.msg' }));
	assert.deepEqual(rows, [{ msg: 'rendered' }]);
});

test('render(false) fetches the pages after it without the browser', async () => {
	const { rows } = await runChain(new Osmotic().render(false).get(site.url('/js')).set({ msg: '.msg' }));
	assert.deepEqual(rows, [{ msg: '' }]);
});

test('waitFor waits for content that appears after the load event', async () => {
	const chain = new Osmotic().render({ waitFor: '.late' }).get(site.url('/late')).set({ late: '.late' });
	const { rows } = await runChain(chain);
	assert.deepEqual(rows, [{ late: 'arrived' }]);
});

test('actions run before the HTML is captured', async () => {
	const chain = new Osmotic()
		.render({ actions: (page) => page.click('button') })
		.get(site.url('/button'))
		.set({ clicked: '.clicked' });
	const { rows } = await runChain(chain);
	assert.deepEqual(rows, [{ clicked: 'yes' }]);
});

test('render options apply to the pages loaded after the step, including followed ones', async () => {
	const chain = new Osmotic()
		.render(false)
		.get(site.url('/links'))
		.render({ waitFor: '.msg, .late' })
		.follow('a@href')
		.set({ text: '.msg, .late' });
	const { rows } = await runChain(chain);
	assert.deepEqual(rows.map((r) => r.text).sort(), ['arrived', 'rendered']);
});

test('block keeps matching resource types from loading', async () => {
	const chain = new Osmotic()
		.render({ block: ['image'] })
		.get(site.url('/image'))
		.set({ msg: '.msg' });
	const { rows } = await runChain(chain);
	assert.deepEqual(rows, [{ msg: 'has image' }]);
	assert.ok(!site.paths().includes('/pixel.png'));
});
