const { Osmotic } = require('osmotic');

// Only pages after render() go through the browser; the rest are fetched as usual
Osmotic.plugins([require('../dist/index.cjs')({ renderAll: false })]);

new Osmotic()
	// Wait for the quotes, then scroll to the bottom before the HTML is captured
	.render({
		waitFor: '.quote',
		actions: (page) => page.mouse.wheel(0, 10000),
	})
	.get('https://quotes.toscrape.com/js/')
	.find('.quote')
	.set({ text: '.text', author: '.author' })
	.data((quote) => console.log(quote))
	.config({ maxPages: 1 })
	.run();
