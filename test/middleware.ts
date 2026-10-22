import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { Osmotic } from 'osmotic';
import playwright from '../src/index.cjs';
import { createSite, runChain, scripted, type Site } from './helpers/index.js';

// What middleware in front of the plugin received: the response's status, headers and body
interface Seen {
	status: number;
	headers: Headers;
	body: string;
}

let site: Site;

before(async () => {
	site = await createSite({
		'/headers': { body: '<p>headers</p>', headers: { 'x-test': '1', 'set-cookie': ['a=1', 'b=2'] } },
		'/sized': { body: '<p>sized</p>', headers: { 'content-length': '12' } },
		'/cookie': scripted(
			`document.body.insertAdjacentHTML('beforeend', '<img src="http://localhost:' + location.port + '/other.png">');` +
				`fetch('/api').then(() => document.body.insertAdjacentHTML('beforeend', '<p class="done">done</p>'))`,
		),
		'/api': { type: 'application/json', body: '{}' },
		'/other.png': { type: 'image/png' },
		'/challenge': {
			status: 202,
			headers: { 'x-amzn-waf-action': 'challenge' },
			body: '<p id="raw">raw</p><script>document.getElementById("raw").remove()</script>',
		},
		'/captcha': { status: 405, headers: { 'x-amzn-waf-action': 'captcha' }, body: '<p>captcha</p>' },
	});
	Osmotic.plugins([playwright]);
});

after(() => site.close());

// A chain whose own middleware, which runs in front of the plugin, records the responses
function recording(chain: Osmotic, seen: Seen[]): Osmotic {
	return chain.useFetch(async (req, next) => {
		const res = await next(req);
		seen.push({ status: res.status, headers: res.headers, body: await res.clone().text() });
		return res;
	});
}

test('middleware in front of the plugin sees the response headers, each set-cookie separately', async () => {
	const seen: Seen[] = [];
	await runChain(recording(new Osmotic(), seen).get(site.url('/headers')));
	assert.equal(seen.length, 1);
	assert.equal(seen[0].headers.get('x-test'), '1');
	assert.deepEqual(seen[0].headers.getSetCookie(), ['a=1', 'b=2']);
});

test('content-length of the original body is not copied to the rendered response', async () => {
	const seen: Seen[] = [];
	await runChain(recording(new Osmotic(), seen).get(site.url('/sized')));
	assert.equal(seen.length, 1);
	assert.equal(seen[0].headers.get('content-length'), null);
});

test('a Cookie header from middleware in front is a cookie for the page site only', async () => {
	const chain = new Osmotic()
		.useFetch((req, next) => next({ ...req, headers: { ...req.headers, Cookie: 'token=abc' } }))
		.render({ waitFor: '.done', timeout: 5000 })
		.get(site.url('/cookie'))
		.set({ done: '.done' });
	const { rows, errors } = await runChain(chain);
	assert.deepEqual(errors, []);
	assert.deepEqual(rows, [{ done: 'done' }]);
	const cookieOf = (path: string, host: string) =>
		site.requests.find((r) => r.path === path && r.host.startsWith(host))?.headers.cookie;
	assert.equal(cookieOf('/cookie', '127.0.0.1'), 'token=abc');
	assert.equal(cookieOf('/api', '127.0.0.1'), 'token=abc');
	assert.ok(site.requests.some((r) => r.path === '/other.png' && r.host.startsWith('localhost')));
	assert.equal(cookieOf('/other.png', 'localhost'), undefined);
});

test('a 2xx AWS WAF response is returned with its raw body, without waiting for waitFor', async () => {
	const seen: Seen[] = [];
	const chain = recording(new Osmotic(), seen)
		.render({ waitFor: '.never', timeout: 5000 })
		.get(site.url('/challenge'));
	const started = Date.now();
	const { errors } = await runChain(chain);
	assert.deepEqual(errors, []);
	assert.ok(Date.now() - started < 5000);
	assert.equal(seen.length, 1);
	assert.equal(seen[0].status, 202);
	assert.equal(seen[0].headers.get('x-amzn-waf-action'), 'challenge');
	assert.match(seen[0].body, /<p id="raw">raw<\/p>/);
});

test('a non-2xx AWS WAF response is returned with its body and headers', async () => {
	const seen: Seen[] = [];
	await runChain(recording(new Osmotic(), seen).get(site.url('/captcha')));
	assert.equal(seen.length, 1);
	assert.equal(seen[0].status, 405);
	assert.equal(seen[0].headers.get('x-amzn-waf-action'), 'captcha');
	assert.equal(seen[0].body, '<p>captcha</p>');
});
