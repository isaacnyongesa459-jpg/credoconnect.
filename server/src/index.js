'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');

const app = express();
const port = Number(process.env.PORT || 5000);
const supportedNetworks = Object.freeze([
  { id: 'safaricom', name: 'Safaricom', country: 'KE', enabled: true },
  { id: 'airtel', name: 'Airtel', country: 'KE', enabled: true },
]);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.APP_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'credoconnect-api',
  integrations: { catalogue: 'not_configured', payments: 'not_configured', delivery: 'not_configured' },
}));

app.get('/api/networks', (_req, res) => res.json({ networks: supportedNetworks }));

const catalogueQuery = z.object({
  network: z.enum(['safaricom', 'airtel']),
  category: z.enum(['sms', 'data', 'voice']),
});
app.get('/api/products', (req, res) => {
  const parsed = catalogueQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Select a supported network and bundle category.' });
  // Intentionally no static catalogue: only an authorized provider adapter may return saleable products.
  return res.status(503).json({
    available: false,
    products: [],
    reason: 'provider_not_configured',
    message: 'Live products are unavailable until an authorized provider connection has been verified.',
  });
});

app.post('/api/orders', (_req, res) => res.status(503).json({
  available: false,
  reason: 'commerce_not_enabled',
  message: 'Purchases are disabled until authorized bundle delivery and verified payment processing are configured.',
}));

app.use((err, _req, res, _next) => {
  console.error('Request failed:', err.message);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (require.main === module) app.listen(port, '0.0.0.0', () => console.log(`CredoConnect API listening on ${port}`));
module.exports = { app, supportedNetworks };
