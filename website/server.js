'use strict';

const crypto = require('node:crypto');
const express = require('express');
const path = require('node:path');
const { getMockCatalogue } = require('./client/mock-catalogue');

const app = express();
const port = Number(process.env.PORT || 3000);
const root = __dirname;
const sandboxStkTests = new Map();

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));
app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin === 'https://isaacnyongesa459-jpg.github.io' || origin === 'https://credoconnect-jumrldgs.manus.space') {
    res.setHeader('access-control-allow-origin', origin);
    res.setHeader('vary', 'Origin');
    res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
    res.setHeader('access-control-allow-headers', 'content-type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return `254${digits.slice(1)}`;
  throw new Error('Enter a valid Kenyan M-Pesa number, for example 0712345678.');
}

function sandboxEnabled() {
  return process.env.MPESA_TEST_MODE === 'true'
    && process.env.MPESA_ENV === 'sandbox';
}

function timestampNairobi() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
  return `${values.year}${values.month}${values.day}${values.hour}${values.minute}${values.second}`;
}

async function darajaAccessToken() {
  const credentials = `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`;
  const response = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { authorization: `Basic ${Buffer.from(credentials).toString('base64')}` },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error(body.errorMessage || 'Daraja sandbox authentication failed.');
  return body.access_token;
}

async function initiateSandboxStk({ payerPhone, amount, recipientPhone }) {
  if (!sandboxEnabled()) throw new Error('Sandbox STK Push is not enabled on this server.');
  const phone = normalizePhone(payerPhone);
  const recipient = normalizePhone(recipientPhone);
  const numericAmount = Number(amount);
  if (!Number.isInteger(numericAmount) || numericAmount < 1 || numericAmount > 250000) {
    throw new Error('Enter a whole KSh amount between 1 and 250,000.');
  }
  const shortcode = String(process.env.MPESA_SHORTCODE || '');
  const passkey = String(process.env.MPESA_PASSKEY || '');
  const transactionType = process.env.MPESA_TRANSACTION_TYPE || 'CustomerPayBillOnline';
  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (!shortcode || !passkey || !callbackUrl) throw new Error('Daraja sandbox configuration is incomplete.');

  const timestamp = timestampNairobi();
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const token = await darajaAccessToken();
  const response = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: transactionType,
      Amount: numericAmount,
      PartyA: phone,
      PartyB: shortcode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: 'CREDO-TEST',
      TransactionDesc: 'CredoConnect sandbox test',
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.ResponseCode !== '0') {
    const error = new Error(body.errorMessage || body.ResponseDescription || 'Daraja rejected the sandbox STK request.');
    error.providerResponse = body;
    throw error;
  }
  sandboxStkTests.set(body.CheckoutRequestID, {
    recipientPhone: recipient,
    amountKes: numericAmount,
    createdAt: Date.now(),
    status: 'PENDING',
    callbackResultCode: null,
    callbackResultDescription: null,
  });
  return body;
}

app.use(express.static(root, { index: 'index.html' }));

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'credoconnect-public-catalogue',
  mode: sandboxEnabled() ? 'mock-ui-plus-mpesa-sandbox' : 'mock-ui-only',
  payments: sandboxEnabled() ? 'mpesa-sandbox-stk-only' : 'disabled',
  fulfilment: 'disabled',
  database: 'disabled',
}));

app.get('/api/products', (req, res) => {
  const network = String(req.query.network || '');
  const category = String(req.query.category || '');
  if (!['safaricom', 'airtel'].includes(network) || !['data', 'sms', 'voice'].includes(category)) {
    return res.status(400).json({ error: 'Select a supported network and category.' });
  }
  return res.json(getMockCatalogue({ network, category }));
});

app.post('/api/test/mpesa/stk-push', async (req, res) => {
  if (!sandboxEnabled()) return res.status(404).json({ error: 'Sandbox STK Push is disabled.' });
  try {
    const result = await initiateSandboxStk(req.body || {});
    return res.status(202).json({
      testMode: true,
      persisted: false,
      vinnieDispatch: 'disabled',
      checkoutRequestId: result.CheckoutRequestID,
      merchantRequestId: result.MerchantRequestID,
      message: result.CustomerMessage || 'STK Push sent. Check the sandbox phone prompt.',
    });
  } catch (error) {
    const provider = error.providerResponse || {};
    const providerMessage = provider.errorMessage || provider.ResponseDescription || provider.CustomerMessage;
    const message = providerMessage || error.message || 'Could not start sandbox STK Push.';
    const validationError = /valid Kenyan|whole KSh|configuration is incomplete|not enabled/i.test(message);
    console.error('Sandbox STK request failed:', JSON.stringify({ message, errorCode: provider.errorCode || provider.errorCode, responseCode: provider.ResponseCode }));
    return res.status(validationError ? 400 : 502).json({
      error: message,
      providerCode: provider.errorCode || provider.ResponseCode || null,
      testMode: true,
    });
  }
});

app.get('/api/test/mpesa/status/:checkoutRequestId', (req, res) => {
  const checkoutRequestId = String(req.params.checkoutRequestId || '');
  const test = sandboxStkTests.get(checkoutRequestId);
  if (!test) return res.status(404).json({ error: 'Sandbox checkout request not found or expired.' });
  return res.json({
    testMode: true,
    status: test.status,
    resultCode: test.callbackResultCode,
    resultDescription: test.callbackResultDescription,
  });
});

app.post('/api/payments/mpesa/callback', (req, res) => {
  const callback = req.body?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID) return res.status(400).json({ ResultCode: 1, ResultDesc: 'Invalid sandbox callback.' });
  const test = sandboxStkTests.get(callback.CheckoutRequestID);
  if (test) {
    test.status = Number(callback.ResultCode) === 0 ? 'SUCCEEDED' : 'FAILED';
    test.callbackResultCode = callback.ResultCode;
    test.callbackResultDescription = callback.ResultDesc || 'Sandbox callback received.';
  }
  console.log('Sandbox M-Pesa callback acknowledged; no database write or Vinnie dispatch.', callback.ResultCode);
  return res.json({ ResultCode: 0, ResultDesc: 'Accepted for sandbox testing.' });
});

app.listen(port, '0.0.0.0', () => console.log(`CredoConnect public catalogue listening on ${port}`));
