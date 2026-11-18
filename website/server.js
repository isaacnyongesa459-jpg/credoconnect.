'use strict';

const express = require('express');
const path = require('node:path');
const { getMockCatalogue } = require('./client/mock-catalogue');

const app = express();
const port = Number(process.env.PORT || 3000);
const root = __dirname;

app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '16kb' }));
app.use(express.static(root, { index: 'index.html' }));

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'credoconnect-public-catalogue',
  mode: 'mock-ui-only',
  payments: 'disabled',
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

app.listen(port, '0.0.0.0', () => console.log(`CredoConnect public catalogue listening on ${port}`));
