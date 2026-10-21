const { Osmotic } = require('osmotic');

// quotes.toscrape.com/js builds its quotes with JavaScript, so without the plugin
// the page has none. Blocking images and fonts makes each page load faster.
Osmotic.plugins([require('../dist/index.cjs')({ block: ['image', 'font'] })]);

Osmotic.get('https://quotes.toscrape.com/js/')
	.recurse('li.next a@href')
	.find('.quote')
	.set({ text: '.text', author: '.author', tags: ['.tag'] })
	.data((quote) => console.log(quote))
	.config({ maxPages: 2 })
	.run();
