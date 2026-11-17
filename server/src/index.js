'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const path = require('node:path');
const { createPrismaSessionStore, createWhatsAppConversation } = require('./whatsapp');

const app = express();
const port = Number(process.env.PORT || 5000);
const projectRoot = path.resolve(__dirname, '../..');
const clientRoot = path.join(projectRoot, 'client');
const supportedNetworks = Object.freeze([
  { id: 'safaricom', name: 'Safaricom', country: 'KE', enabled: true },
  { id: 'airtel', name: 'Airtel', country: 'KE', enabled: true },
]);

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.APP_ORIGIN || 'http://localhost:5000', credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/client', express.static(clientRoot, { fallthrough: false }));

app.get('/', (_req, res) => res.sendFile(path.join(projectRoot, 'index.html')));

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

async function getCatalogue({ network, category }) {
  // Intentionally no static catalogue: only an authorized provider adapter may return saleable products.
  return {
    available: false,
    products: [],
    reason: 'provider_not_configured',
    message: 'Live products are unavailable until an authorized provider connection has been verified.',
  };
}

app.get('/api/products', (req, res) => {
  const parsed = catalogueQuery.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: 'Select a supported network and bundle category.' });
  return getCatalogue(parsed.data).then((catalogue) => res.status(503).json(catalogue));
});

app.post('/api/orders', (_req, res) => res.status(503).json({
  available: false,
  reason: 'commerce_not_enabled',
  message: 'Purchases are disabled until authorized bundle delivery and verified payment processing are configured.',
}));

let whatsappSessionStore;
if (process.env.DATABASE_URL && process.env.WHATSAPP_SESSION_STORE !== 'memory') {
  try {
    const { PrismaClient } = require('@prisma/client');
    whatsappSessionStore = createPrismaSessionStore(new PrismaClient());
  } catch (error) {
    console.warn(`WhatsApp database sessions unavailable: ${error.message}`);
  }
}
const whatsappConversation = createWhatsAppConversation({
  catalogueLoader: getCatalogue,
  sessionStore: whatsappSessionStore,
});

function extractWhatsAppMessage(payload = {}) {
  if (payload.from || payload.phone || payload.message || payload.text) {
    return {
      from: payload.from || payload.phone,
      text: typeof payload.message === 'string' ? payload.message : (payload.text || payload.message?.text?.body),
    };
  }
  const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  return { from: message?.from, text: message?.text?.body };
}

app.get('/api/whatsapp/webhook', (req, res) => {
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!expected || req.query['hub.verify_token'] !== expected) return res.sendStatus(403);
  return res.type('text/plain').send(String(req.query['hub.challenge'] || ''));
});

app.post('/api/whatsapp/webhook', express.urlencoded({ extended: false }), async (req, res, next) => {
  try {
    if (process.env.WHATSAPP_WEBHOOK_SECRET && req.get('x-whatsapp-webhook-secret') !== process.env.WHATSAPP_WEBHOOK_SECRET) {
      return res.sendStatus(403);
    }
    const { from, text } = extractWhatsAppMessage(req.body);
    const result = await whatsappConversation.handle(from, text);
    if (!result.ok) return res.status(400).json(result);
    return res.json({ to: from, reply: result.message, state: result.state });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/whatsapp/messages', async (req, res, next) => {
  try {
    const { from, text } = extractWhatsAppMessage(req.body);
    const result = await whatsappConversation.handle(from, text);
    if (!result.ok) return res.status(400).json(result);
    return res.json({ to: from, reply: result.message, state: result.state });
  } catch (error) {
    return next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error('Request failed:', err.message);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

if (require.main === module) app.listen(port, '0.0.0.0', () => console.log(`CredoConnect API listening on ${port}`));
module.exports = { app, supportedNetworks };
