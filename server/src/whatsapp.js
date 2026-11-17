'use strict';

const SESSION_TTL_MS = 15 * 60 * 1000;
const SUPPORTED_NETWORKS = Object.freeze([
  { id: 'safaricom', name: 'Safaricom' },
  { id: 'airtel', name: 'Airtel' },
]);
const CATEGORIES = Object.freeze({
  data: 'Internet Bundles',
  sms: 'SMS Bundles',
  voice: 'Voice Minutes',
});

function normalizeText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function normalizePhone(value) {
  const raw = normalizeText(value).replace(/[\s()-]/g, '');
  if (/^07\d{8}$/.test(raw) || /^01\d{8}$/.test(raw)) return `+254${raw.slice(1)}`;
  if (/^254[17]\d{8}$/.test(raw)) return `+${raw}`;
  if (/^\+254[17]\d{8}$/.test(raw)) return raw;
  return null;
}

function createMemorySessionStore(now = () => Date.now()) {
  const sessions = new Map();
  return {
    async get(phone) {
      const session = sessions.get(phone);
      if (!session || session.expiresAt <= now()) {
        sessions.delete(phone);
        return null;
      }
      return session;
    },
    async set(phone, session) {
      sessions.set(phone, session);
      return session;
    },
    async delete(phone) {
      sessions.delete(phone);
    },
    size() { return sessions.size; },
  };
}

function createPrismaSessionStore(prisma, now = () => new Date()) {
  return {
    async get(phone) {
      const record = await prisma.whatsappSession.findUnique({ where: { phone } });
      if (!record) return null;
      if (record.expiresAt.getTime() <= now().getTime()) {
        await prisma.whatsappSession.delete({ where: { phone } }).catch(() => {});
        return null;
      }
      return { state: record.state.state, data: record.state.data, expiresAt: record.expiresAt.getTime() };
    },
    async set(phone, session) {
      return prisma.whatsappSession.upsert({
        where: { phone },
        update: { state: { state: session.state, data: session.data }, expiresAt: new Date(session.expiresAt) },
        create: { phone, state: { state: session.state, data: session.data }, expiresAt: new Date(session.expiresAt) },
      });
    },
    async delete(phone) {
      await prisma.whatsappSession.delete({ where: { phone } }).catch(() => {});
    },
  };
}

function makeSession(now = Date.now()) {
  return {
    state: 'main',
    data: {},
    expiresAt: now + SESSION_TTL_MS,
  };
}

function touch(session, now = Date.now()) {
  session.expiresAt = now + SESSION_TTL_MS;
  return session;
}

function menuMessage() {
  return [
    'Welcome to CredoConnect!',
    '',
    'How can we help you today?',
    '',
    '1. Buy Internet Bundles',
    '2. Buy SMS Bundles',
    '3. Buy Voice Minutes',
    '4. Check Account Balance',
    '5. View Transaction History',
    '6. Contact Customer Support',
    '7. My Account',
    '',
    'Reply with the number of your choice.',
  ].join('\n');
}

function networkMenu(category) {
  return [
    `${CATEGORIES[category]} — choose your network`,
    '',
    '1. Safaricom',
    '2. Airtel',
    '3. Back to Main Menu',
    '',
    'Reply with your choice.',
  ].join('\n');
}

function normalizeProduct(product) {
  if (!product || !product.id || !product.name || product.priceKes == null) return null;
  const amount = Number(product.priceKes);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return {
    id: String(product.id),
    name: String(product.name),
    quantity: product.quantity ? String(product.quantity) : '',
    priceKes: amount,
    validity: product.validity ? String(product.validity) : '',
  };
}

function productsMessage(network, category, products) {
  const lines = [`${network} ${CATEGORIES[category]}`, ''];
  products.forEach((product, index) => {
    const detail = [product.quantity, `KSh ${product.priceKes}`, product.validity].filter(Boolean).join(' — ');
    lines.push(`${index + 1}. ${product.name}${detail ? ` — ${detail}` : ''}`);
  });
  lines.push(`${products.length + 1}. Back`);
  lines.push('', 'Reply with your choice.');
  return lines.join('\n');
}

function productUnavailable(network, category) {
  return [
    `We cannot display ${network} ${CATEGORIES[category].toLowerCase()} right now.`,
    '',
    'Live packages and prices are shown only after an authorized provider catalogue is connected.',
    '',
    'Reply 1 to choose another network or 2 for the Main Menu.',
  ].join('\n');
}

function confirmationMessage(session) {
  const { product, network, recipientPhone } = session.data;
  return [
    'Please confirm your purchase:',
    '',
    `- Package: ${product.name}`,
    `- Network: ${network}`,
    `- Phone Number: ${recipientPhone}`,
    `- Amount: KSh ${product.priceKes}`,
    '',
    '1. Confirm and Pay',
    '2. Cancel',
  ].join('\n');
}

function supportMessage() {
  return 'Customer support is being prepared. Please visit the CredoConnect website or reply 1 for the Main Menu.';
}

function unavailableFeatureMessage(feature) {
  return `${feature} is not connected yet. No request or charge was made.\n\nReply 1 for the Main Menu.`;
}

function interpretIntent(text) {
  const lower = text.toLowerCase();
  if (/\b(hi|hello|hey|start|menu)\b/.test(lower)) return { type: 'menu' };
  if (/\b(cancel|stop|quit)\b/.test(lower)) return { type: 'cancel' };
  if (/\b(back|previous)\b/.test(lower)) return { type: 'back' };
  if (/\b(airtime|air time)\b/.test(lower)) return { type: 'unsupported-airtime' };
  const network = lower.includes('safaricom') ? 'safaricom' : lower.includes('airtel') ? 'airtel' : null;
  const category = /\b(data|internet|bundle|bundles|gb)\b/.test(lower)
    ? 'data'
    : /\b(sms|texts?|messages?)\b/.test(lower)
      ? 'sms'
      : /\b(voice|minutes?|calls?)\b/.test(lower)
        ? 'voice'
        : null;
  if (category) return { type: 'catalogue', category, network };
  if (/\b(balance|airtime balance|account balance)\b/.test(lower)) return { type: 'balance' };
  if (/\b(history|transactions?|purchases?)\b/.test(lower)) return { type: 'history' };
  if (/\b(support|help|agent|customer care)\b/.test(lower)) return { type: 'support' };
  if (/\b(account|profile)\b/.test(lower)) return { type: 'account' };
  return null;
}

function createWhatsAppConversation({
  catalogueLoader = async () => ({ available: false, products: [], reason: 'provider_not_configured' }),
  paymentHandler = async () => ({ status: 'not_configured' }),
  sessionStore = createMemorySessionStore(),
  now = () => Date.now(),
} = {}) {
  async function loadSession(phone) {
    return (await sessionStore.get(phone)) || makeSession(now());
  }

  async function save(phone, session) {
    touch(session, now());
    await sessionStore.set(phone, session);
  }

  async function openCatalogue(phone, session, category, networkId) {
    const network = SUPPORTED_NETWORKS.find((item) => item.id === networkId);
    if (!network || !CATEGORIES[category]) return 'Please choose a supported option.';
    const result = await catalogueLoader({ network: network.id, category });
    const products = Array.isArray(result?.products) ? result.products.map(normalizeProduct).filter(Boolean) : [];
    if (!result?.available || products.length === 0) {
      session.state = 'network';
      session.data = { category };
      await save(phone, session);
      return productUnavailable(network.name, category);
    }
    session.state = 'products';
    session.data = { category, networkId: network.id, network: network.name, products };
    await save(phone, session);
    return productsMessage(network.name, category, products);
  }

  async function handle(phoneInput, textInput) {
    const phone = normalizePhone(phoneInput) || normalizeText(phoneInput);
    const text = normalizeText(textInput);
    if (!phone || !text) return { ok: false, message: 'A phone number and message are required.' };

    let session = await loadSession(phone);
    const intent = interpretIntent(text);
    if (intent?.type === 'menu') {
      session = makeSession(now());
      await save(phone, session);
      return { ok: true, message: menuMessage(), state: session.state };
    }
    if (intent?.type === 'cancel') {
      await sessionStore.delete(phone);
      return { ok: true, message: 'Your purchase was cancelled. Reply “Menu” to start again.', state: 'expired' };
    }
    if (intent?.type === 'unsupported-airtime') {
      return { ok: true, message: 'CredoConnect currently supports SMS, data, and voice bundles. Airtime is not available.', state: session.state };
    }
    if (intent?.type === 'catalogue') {
      session = makeSession(now());
      if (intent.network) return { ok: true, message: await openCatalogue(phone, session, intent.category, intent.network), state: session.state };
      session.state = 'network';
      session.data = { category: intent.category };
      await save(phone, session);
      return { ok: true, message: networkMenu(intent.category), state: session.state };
    }
    if (intent?.type === 'balance') return { ok: true, message: unavailableFeatureMessage('Account balance checks'), state: session.state };
    if (intent?.type === 'history') return { ok: true, message: unavailableFeatureMessage('Transaction history'), state: session.state };
    if (intent?.type === 'support') return { ok: true, message: supportMessage(), state: session.state };
    if (intent?.type === 'account') return { ok: true, message: unavailableFeatureMessage('Account management'), state: session.state };
    if (intent?.type === 'back') {
      if (session.state === 'products' || session.state === 'network') {
        session.state = 'main'; session.data = {}; await save(phone, session);
        return { ok: true, message: menuMessage(), state: session.state };
      }
      if (session.state === 'recipient' || session.state === 'confirm') {
        session.state = 'products'; await save(phone, session);
        return { ok: true, message: productsMessage(session.data.network, session.data.category, session.data.products), state: session.state };
      }
    }

    if (session.state === 'main') {
      const choice = Number(text);
      const categories = { 1: 'data', 2: 'sms', 3: 'voice' };
      if (categories[choice]) {
        session.state = 'network'; session.data = { category: categories[choice] }; await save(phone, session);
        return { ok: true, message: networkMenu(categories[choice]), state: session.state };
      }
      if (choice === 4) return { ok: true, message: unavailableFeatureMessage('Account balance checks'), state: session.state };
      if (choice === 5) return { ok: true, message: unavailableFeatureMessage('Transaction history'), state: session.state };
      if (choice === 6) return { ok: true, message: supportMessage(), state: session.state };
      if (choice === 7) return { ok: true, message: unavailableFeatureMessage('Account management'), state: session.state };
      return { ok: true, message: `That selection is not available.\n\n${menuMessage()}`, state: session.state };
    }

    if (session.state === 'network') {
      const networks = { 1: 'safaricom', 2: 'airtel' };
      if (networks[Number(text)]) return { ok: true, message: await openCatalogue(phone, session, session.data.category, networks[Number(text)]), state: session.state };
      if (text === '3') { session.state = 'main'; session.data = {}; await save(phone, session); return { ok: true, message: menuMessage(), state: session.state }; }
      return { ok: true, message: `Please choose 1, 2, or 3.\n\n${networkMenu(session.data.category)}`, state: session.state };
    }

    if (session.state === 'products') {
      const choice = Number(text);
      if (Number.isInteger(choice) && choice >= 1 && choice <= session.data.products.length) {
        session.data.product = session.data.products[choice - 1];
        session.state = 'recipient'; await save(phone, session);
        return { ok: true, message: `You selected ${session.data.product.name} on ${session.data.network}.\n\nPlease enter the phone number to receive the bundle.`, state: session.state };
      }
      if (choice === session.data.products.length + 1) { session.state = 'network'; delete session.data.product; await save(phone, session); return { ok: true, message: networkMenu(session.data.category), state: session.state }; }
      return { ok: true, message: `Please choose a listed package number.\n\n${productsMessage(session.data.network, session.data.category, session.data.products)}`, state: session.state };
    }

    if (session.state === 'recipient') {
      const recipientPhone = normalizePhone(text);
      if (!recipientPhone) return { ok: true, message: 'Please enter a valid Kenyan phone number, such as 0712345678.', state: session.state };
      session.data.recipientPhone = recipientPhone;
      session.state = 'confirm'; await save(phone, session);
      return { ok: true, message: confirmationMessage(session), state: session.state };
    }

    if (session.state === 'confirm') {
      if (text === '2') { await sessionStore.delete(phone); return { ok: true, message: 'Your purchase was cancelled. Reply “Menu” to start again.', state: 'expired' }; }
      if (text === '1') {
        const result = await paymentHandler({ phone, ...session.data });
        if (result?.status === 'initiated') {
          session.state = 'payment_pending'; await save(phone, session);
          return { ok: true, message: 'Your payment request was sent. We will confirm payment and bundle delivery before marking this purchase successful.', state: session.state };
        }
        return { ok: true, message: 'Payments and bundle delivery are not connected yet. No charge was made. Reply 1 for the Main Menu.', state: session.state };
      }
      return { ok: true, message: `Please reply 1 to confirm and pay or 2 to cancel.\n\n${confirmationMessage(session)}`, state: session.state };
    }

    return { ok: true, message: `This conversation session has expired.\n\n${menuMessage()}`, state: 'main' };
  }

  return { handle, menuMessage, networkMenu };
}

module.exports = {
  CATEGORIES,
  SESSION_TTL_MS,
  SUPPORTED_NETWORKS,
  createMemorySessionStore,
  createPrismaSessionStore,
  createWhatsAppConversation,
  normalizePhone,
};
