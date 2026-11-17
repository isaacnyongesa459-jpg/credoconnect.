'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('./index');

let server;
let base;
test.before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function json(path, options) {
  const response = await fetch(`${base}${path}`, options);
  return { response, body: await response.json() };
}

test('root serves the plain HTML storefront', async () => {
  const response = await fetch(`${base}/`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(await response.text(), /CredoConnect/);
});

test('public client assets are served without exposing server source', async () => {
  const asset = await fetch(`${base}/client/styles.css`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type'), /text\/css/);
  const source = await fetch(`${base}/server/src/index.js`);
  assert.notEqual(source.status, 200);
});

test('health states that commerce integrations are not configured', async () => {
  const { response, body } = await json('/api/health');
  assert.equal(response.status, 200);
  assert.equal(body.status, 'ok');
  assert.equal(body.integrations.catalogue, 'not_configured');
  assert.equal(body.integrations.payments, 'not_configured');
});

test('network endpoint returns Safaricom and Airtel only', async () => {
  const { response, body } = await json('/api/networks');
  assert.equal(response.status, 200);
  assert.deepEqual(body.networks.map((item) => item.name), ['Safaricom', 'Airtel']);
});

test('catalogue rejects unsupported network/category combinations', async () => {
  const { response } = await json('/api/products?network=unsupported&category=data');
  assert.equal(response.status, 400);
});

test('catalogue does not fabricate saleable products while provider is unavailable', async () => {
  const { response, body } = await json('/api/products?network=safaricom&category=data');
  assert.equal(response.status, 503);
  assert.equal(body.available, false);
  assert.deepEqual(body.products, []);
  assert.equal(body.reason, 'provider_not_configured');
});

test('order creation stays disabled without verified payment and delivery', async () => {
  const { response, body } = await json('/api/orders', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ productId: 'not-saleable', phone: '0712345678' }),
  });
  assert.equal(response.status, 503);
  assert.equal(body.available, false);
  assert.equal(body.reason, 'commerce_not_enabled');
});
