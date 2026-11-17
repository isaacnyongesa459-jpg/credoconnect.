'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  createMemorySessionStore,
  createWhatsAppConversation,
} = require('./whatsapp');

function configuredConversation() {
  return createWhatsAppConversation({
    catalogueLoader: async () => ({
      available: true,
      products: [{ id: 'sf-data-50', name: '1.5GB', quantity: '1.5GB', priceKes: 50, validity: '24 hours' }],
    }),
    paymentHandler: async () => ({ status: 'not_configured' }),
  });
}

test('welcome and numeric navigation keep a customer in the correct menu state', async () => {
  const bot = configuredConversation();
  const welcome = await bot.handle('0712345678', 'Hi');
  assert.equal(welcome.state, 'main');
  assert.match(welcome.message, /1\. Buy Internet Bundles/);

  const network = await bot.handle('0712345678', '1');
  assert.equal(network.state, 'network');
  assert.match(network.message, /1\. Safaricom/);

  const products = await bot.handle('0712345678', '1');
  assert.equal(products.state, 'products');
  assert.match(products.message, /1\. 1\.5GB/);
});

test('natural language reaches the same catalogue flow without inventing airtime', async () => {
  const bot = configuredConversation();
  const result = await bot.handle('0712345678', 'I want 1.5GB Safaricom bundles');
  assert.equal(result.state, 'products');
  assert.match(result.message, /Safaricom Internet Bundles/);

  const airtime = await bot.handle('0712345678', 'I want airtime');
  assert.match(airtime.message, /does not support|not available/i);
});

test('recipient numbers are validated before confirmation and confirmation never marks payment successful', async () => {
  const bot = configuredConversation();
  await bot.handle('0712345678', 'Hi');
  await bot.handle('0712345678', '1');
  await bot.handle('0712345678', '1');
  await bot.handle('0712345678', '1');
  const invalid = await bot.handle('0712345678', '123');
  assert.match(invalid.message, /valid Kenyan phone number/i);

  const confirmation = await bot.handle('0712345678', '0711111111');
  assert.equal(confirmation.state, 'confirm');
  assert.match(confirmation.message, /Confirm and Pay/);

  const result = await bot.handle('0712345678', '1');
  assert.match(result.message, /not connected|No charge was made/i);
  assert.equal(result.message.includes('purchase successful'), false);
});

test('cancel clears the current session and old selections cannot trigger a purchase', async () => {
  const store = createMemorySessionStore();
  const bot = createWhatsAppConversation({ sessionStore: store });
  await bot.handle('0712345678', 'Hi');
  const cancelled = await bot.handle('0712345678', 'Cancel');
  assert.equal(cancelled.state, 'expired');
  assert.equal(store.size(), 0);
  const afterCancel = await bot.handle('0712345678', '1');
  assert.equal(afterCancel.state, 'network');
  assert.match(afterCancel.message, /choose your network/i);
});
