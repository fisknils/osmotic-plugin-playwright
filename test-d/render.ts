import { Osmotic } from 'osmotic';
import type { RenderOptions } from '../src/index.cjs';

const options: RenderOptions = {
	waitUntil: 'networkidle',
	waitFor: '.price',
	timeout: 5000,
	block: ['image', 'font'],
	actions: async (page, url) => {
		await page.click('button');
		return url;
	},
};

new Osmotic().render().render(options).render(false).get('https://example.com').render({ waitFor: 'h1' }).follow();

// @ts-expect-error: waitUntil takes Playwright's load states
new Osmotic().render({ waitUntil: 'idle' });

// @ts-expect-error: render(true) is not a thing; render() turns rendering on
new Osmotic().render(true);

// passThrough takes the response's URL, status and headers
new Osmotic().render({ passThrough: (res) => res.status === 202 && 'x-a' in res.headers && res.url !== '' });

// @ts-expect-error: passThrough returns a boolean
new Osmotic().render({ passThrough: () => 'yes' });

// @ts-expect-error: waitFor is a selector string
new Osmotic().render({ waitFor: 1 });
