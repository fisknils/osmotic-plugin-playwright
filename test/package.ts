// Runs against the build in dist/, the only place the two entry points can be checked together
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Osmotic } from 'osmotic';

test('require and import of the build return the same plugin function, which plugins() accepts', async () => {
	const cjs: unknown = require('../dist/index.cjs');
	const esm: { default: unknown } = await import('../dist/index.mjs');
	assert.equal(typeof cjs, 'function');
	assert.equal(esm.default, cjs);
	assert.equal(Osmotic.plugins([cjs as () => never]), Osmotic);
	assert.equal(typeof (Osmotic.prototype as unknown as Record<string, unknown>).render, 'function');
});
