'use strict';

(() => {
  const networks = [
    { id: 'safaricom', name: 'Safaricom', mark: 'S', tone: 'green' },
    { id: 'airtel', name: 'Airtel', mark: 'A', tone: 'red' },
  ];
  const categories = [
    { id: 'data', name: 'Data bundles', icon: '◉', detail: 'Internet for your day, week or month.' },
    { id: 'sms', name: 'SMS bundles', icon: '✉', detail: 'Stay in touch, message by message.' },
    { id: 'voice', name: 'Voice minutes', icon: '◖', detail: 'Minutes for the conversations that matter.' },
  ];
  const staticMockProducts = [
    { id: 'mock-sf-data-100', network: 'safaricom', category: 'data', name: 'Mock 1GB Daily', quantity: '1GB', priceKes: 50, validity: '24 hours' },
    { id: 'mock-sf-data-250', network: 'safaricom', category: 'data', name: 'Mock 5GB Weekly', quantity: '5GB', priceKes: 250, validity: '7 days' },
    { id: 'mock-sf-sms-20', network: 'safaricom', category: 'sms', name: 'Mock 200 SMS', quantity: '200 SMS', priceKes: 20, validity: '7 days' },
    { id: 'mock-sf-voice-50', network: 'safaricom', category: 'voice', name: 'Mock 50 Minutes', quantity: '50 minutes', priceKes: 50, validity: '24 hours' },
    { id: 'mock-ar-data-100', network: 'airtel', category: 'data', name: 'Mock 1.5GB Daily', quantity: '1.5GB', priceKes: 100, validity: '24 hours' },
    { id: 'mock-ar-data-300', network: 'airtel', category: 'data', name: 'Mock 10GB Weekly', quantity: '10GB', priceKes: 300, validity: '7 days' },
    { id: 'mock-ar-sms-30', network: 'airtel', category: 'sms', name: 'Mock 300 SMS', quantity: '300 SMS', priceKes: 30, validity: '7 days' },
    { id: 'mock-ar-voice-75', network: 'airtel', category: 'voice', name: 'Mock 75 Minutes', quantity: '75 minutes', priceKes: 75, validity: '24 hours' },
  ];
  const state = {
    page: 'overview',
    category: 'data',
    network: 'safaricom',
    theme: localStorage.getItem('credo-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    menuOpen: false,
    products: [],
    catalogueLoading: false,
    catalogueKey: '',
    stkLoading: false,
  };
  const app = document.getElementById('app');
  const toast = document.getElementById('toast');
  let toastTimer;

  const icons = {
    overview: '<svg viewBox="0 0 24 24"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/></svg>',
    bundles: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h7M7 16h4"/></svg>',
    history: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 2.6-6.4L3 8"/><path d="M3 3v5h5m4-1v5l3 2"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M20.8 8.6c0 5.1-8.8 10-8.8 10S3.2 13.7 3.2 8.6A4.4 4.4 0 0 1 12 6.4a4.4 4.4 0 0 1 8.8 2.2Z"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.3 1.1-1.8 1.4-1.8 3M12 17.2h.01"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.4"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20.5 15A8.5 8.5 0 0 1 9 3.5 8.5 8.5 0 1 0 20.5 15Z"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></svg>',
  };

  function icon(name) { return icons[name] || ''; }
  function currentNetwork() { return networks.find((n) => n.id === state.network); }
  function currentCategory() { return categories.find((c) => c.id === state.category); }
  function announce(message) {
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('credo-theme', theme);
  }

  function openBundles(category = 'data') {
    state.category = category;
    state.page = 'bundles';
    state.catalogueKey = '';
    render();
  }

  async function loadCatalogue() {
    const key = `${state.network}:${state.category}`;
    if (state.catalogueLoading || state.catalogueKey === key) return;
    state.catalogueLoading = true;
    state.products = [];
    render();
    try {
      const response = await fetch(`/api/products?network=${encodeURIComponent(state.network)}&category=${encodeURIComponent(state.category)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Catalogue unavailable.');
      state.products = Array.isArray(data.products) ? data.products : [];
      state.catalogueKey = key;
    } catch (error) {
      state.products = staticMockProducts.filter((product) => product.network === state.network && product.category === state.category);
      state.catalogueKey = key;
    } finally {
      state.catalogueLoading = false;
      render();
    }
  }

  async function requestSandboxStk(productId) {
    if (state.stkLoading) return;
    const product = state.products.find((item) => item.id === productId);
    const payerPhone = document.getElementById('payerPhone')?.value.trim();
    const recipientPhone = document.getElementById('recipientPhone')?.value.trim() || payerPhone;
    if (!product) return announce('Select a valid mock package.');
    if (!payerPhone) return announce('Enter the M-Pesa payer phone number first.');
    state.stkLoading = true;
    announce(`Requesting a sandbox STK prompt for KSh ${product.priceKes}…`);
    try {
      const apiBase = window.location.hostname.endsWith('github.io') ? 'https://credoconnect-jumrldgs.manus.space' : '';
      const response = await fetch(`${apiBase}/api/test/mpesa/stk-push`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ payerPhone, recipientPhone, amount: product.priceKes }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'The sandbox STK request failed.');
      announce(`${data.message} Checkout: ${data.checkoutRequestId}`);
    } catch (error) {
      announce(error.message);
    } finally {
      state.stkLoading = false;
    }
  }

  function pageTitle() {
    return ({ overview: 'Your connection, at a glance', bundles: 'Find your next bundle', transactions: 'Your transactions', recipients: 'Saved recipients', account: 'Your account', help: 'How can we help?' })[state.page] || 'CredoConnect';
  }

  function logo(compact = false) {
    return `<div class="brand-lockup"><span class="brand-symbol" aria-hidden="true"><svg viewBox="0 0 40 40"><path d="M28 11a13 13 0 1 0 0 18"/><path d="M23 16a6 6 0 1 0 0 8"/><circle cx="30" cy="10" r="3"/><circle cx="30" cy="30" r="3"/></svg></span>${compact ? '' : '<span class="brand-name">Credo<span>Connect</span><small>Your Network. Your Bundles.</small></span>'}</div>`;
  }

  function navLink(page, label, symbol) {
    return `<button class="nav-item ${state.page === page ? 'active' : ''}" data-page="${page}">${icon(symbol)}<span>${label}</span>${state.page === page ? '<i></i>' : ''}</button>`;
  }

  function shell(content) {
    return `<aside class="sidebar ${state.menuOpen ? 'open' : ''}" id="sidebar">
      <div class="sidebar-brand">${logo()}<button class="icon-btn close-menu" data-action="close-menu" aria-label="Close navigation">×</button></div>
      <div class="side-label">WORKSPACE</div>
      <nav class="side-nav" aria-label="Main navigation">
        ${navLink('overview','Overview','overview')}${navLink('bundles','Browse bundles','bundles')}${navLink('transactions','Transactions','history')}${navLink('recipients','Saved recipients','heart')}
      </nav>
      <div class="side-label quick-label">QUICK BUY</div>
      <div class="quick-links">${categories.map((c) => `<button class="quick-link" data-category="${c.id}"><span>${c.icon}</span>${c.name}<b>›</b></button>`).join('')}</div>
      <div class="sidebar-fill"></div>
      <div class="support-box"><div class="support-mark">${icon('help')}</div><strong>Need a hand?</strong><p>Our support team is here for you.</p><button data-page="help">Visit help centre ${icon('arrow')}</button></div>
      <button class="account-row" data-page="account"><span class="avatar">CC</span><span><b>My account</b><small>Manage your profile</small></span>${icon('user')}</button>
    </aside>
    <main class="main-shell">
      <header class="topbar"><button class="icon-btn menu-btn" data-action="open-menu" aria-label="Open navigation">☰</button><div class="breadcrumbs"><span>CredoConnect</span><i>/</i><b>${pageTitle()}</b></div><div class="top-actions"><span class="connection-state"><i></i> Catalogue offline</span><button class="icon-btn" data-action="theme" aria-label="Toggle theme">${icon(state.theme === 'dark' ? 'sun' : 'moon')}</button><span class="top-avatar">C</span></div></header>
      <div class="page-wrap">${content}<footer class="footer"><span>© 2026 CredoConnect</span><span><i></i> Built for Kenya · Safaricom &amp; Airtel</span><button data-page="help">Help &amp; support</button></footer></div>
    </main>${state.menuOpen ? '<button class="scrim" data-action="close-menu" aria-label="Close menu"></button>' : ''}`;
  }

  function overview() {
    return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><i></i> YOUR CONNECTION, SIMPLIFIED</div><h1>Your network.<br><span>Your bundles.</span></h1><p>Find the right bundle for the right number. One easy place to stay connected.</p><div class="hero-buttons"><button class="primary-btn" data-category="data">Explore bundles ${icon('arrow')}</button><a class="plain-link" href="https://credoconnect-jumrldgs.manus.space/mpesa-test.html">Test M-Pesa sandbox STK ${icon('arrow')}</a><span>${icon('shield')} Secure checkout is being prepared</span></div></div>
      <div class="hero-art" aria-hidden="true"><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="orb-core">${logo(true)}<small>ONE CONNECTION</small></div><i class="orb-dot d1"></i><i class="orb-dot d2"></i><i class="orb-dot d3"></i><span class="orb-signal">⌁</span></div>
      <div class="hero-foot"><span>TWO NETWORKS. YOUR CHOICE.</span><span><i class="net-mark sm">S</i><i class="net-mark ar">A</i></span></div></section>
      <section class="section-head"><div><small>PICK YOUR CONNECTION</small><h2>Choose a network</h2><p>Start with the number you want to receive a bundle.</p></div><span class="two-supported"><i></i> 2 supported networks</span></section>
      <div class="network-grid">${networks.map((n) => `<button class="network-card ${state.network === n.id ? `selected ${n.tone}` : ''}" data-network="${n.id}"><span class="network-logo ${n.tone}">${n.mark}</span><span><b>${n.name}</b><small>SMS · Data · Voice</small></span><i class="radio">${state.network === n.id ? '✓' : ''}</i></button>`).join('')}</div>
      <section class="section-head category-head"><div><small>EXPLORE BY TYPE</small><h2>What do you need?</h2></div><button class="plain-link" data-page="bundles">All bundles ${icon('arrow')}</button></section>
      <div class="category-grid">${categories.map((c, i) => `<button class="category-card cat-${c.id}" data-category="${c.id}"><span class="card-index">0${i + 1}</span><span class="category-icon">${c.icon}</span><b>${c.name}</b><p>${c.detail}</p><span class="category-link">Browse category ${icon('arrow')}</span></button>`).join('')}</div>
      <div class="honesty-note"><span class="note-symbol">◈</span><p><b>Public test catalogue.</b> These packages are fictional and available for interface testing only. No payment or order is created.</p><span class="note-pill">MOCK DATA ONLY</span></div>`;
  }

  function bundlesPage() {
    const n = currentNetwork();
    const c = currentCategory();
    const cards = state.catalogueLoading ? '<div class="mock-loading">Loading local catalogue…</div>' : state.products.map((product) => `<article class="product-card"><div><span class="mock-label">LOCAL MOCK</span><h3>${product.name}</h3><p>${product.quantity} · ${product.validity}</p></div><strong>KSh ${product.priceKes}</strong><button class="primary-btn product-select" data-product="${product.id}">Select</button></article>`).join('');
    return `<section class="catalogue-title"><div><small>BROWSE CATALOGUE</small><h1>${c.name} <span>for your number.</span></h1><p>Choose your network and see eligible options.</p></div><span class="offline-badge mock-badge"><i></i> Local mock catalogue</span></section>
      <section class="filters"><div><small>NETWORK</small><div class="segments">${networks.map((net) => `<button class="${state.network === net.id ? 'chosen' : ''}" data-network="${net.id}"><i class="segment-mark ${net.tone}">${net.mark}</i>${net.name}</button>`).join('')}</div></div>
      <label><small>BUNDLE TYPE</small><span class="select-wrap"><select id="categorySelect">${categories.map((cat) => `<option value="${cat.id}" ${state.category === cat.id ? 'selected' : ''}>${cat.name}</option>`).join('')}</select><b>⌄</b></span></label>
      <label class="search-wrap"><small>M-PESA PAYER PHONE</small><input type="tel" id="payerPhone" placeholder="07XX XXX XXX" autocomplete="tel" required><span>Sandbox STK recipient</span></label>
      <label class="search-wrap"><small>AIRTIME RECIPIENT (OPTIONAL)</small><input type="tel" id="recipientPhone" placeholder="07XX XXX XXX" autocomplete="tel"><span>Test mode only</span></label></section>
      <div class="catalogue-row"><div><i class="network-logo tiny ${n.tone}">${n.mark}</i><b>${n.name}</b><i class="vbar"></i><span>${c.name}</span></div><span>${state.products.length} mock products</span></div>
      <div class="mock-notice"><b>Local UI test data only.</b> These names, prices, and packages are fictional and cannot be purchased.</div>
      <section class="product-grid">${cards || '<div class="mock-loading">No mock products for this selection.</div>'}</section>
      <div class="safe-checkout">${icon('shield')} <span><b>Sandbox test mode.</b> Selecting a package sends an STK prompt for its mock KSh amount; no order or database record is created.</span></div>`;
  }

  function emptyPage(kicker, title, text, symbol = 'history', actionLabel = 'Browse mock bundles') {
    return `<section class="empty-page"><div class="empty-page-icon">${icon(symbol)}</div><small>${kicker}</small><h1>${title}</h1><p>${text}</p><button class="primary-btn" data-page="bundles">${actionLabel} ${icon('arrow')}</button><span class="in-progress"><i></i> TEST MODE</span></section>`;
  }

  function helpPage() {
    return `<section class="help-page"><small>SUPPORT</small><h1>Help that stays connected.</h1><p>Customer support and order tracking are being prepared. Live purchase assistance will be available when provider integration is complete.</p><article><span>${icon('help')}</span><div><b>Need help with this preview?</b><p>Bundle purchases and payments are not enabled. No money can be charged from this site.</p></div></article><article><span>${icon('shield')}</span><div><b>Why are bundles unavailable?</b><p>Current Safaricom and Airtel products require an authorized commercial provider. We don’t invent package listings or prices.</p></div></article></section>`;
  }

  function render() {
    setTheme(state.theme);
    const content = state.page === 'overview' ? overview()
      : state.page === 'bundles' ? bundlesPage()
      : state.page === 'transactions' ? emptyPage('TEST HISTORY', 'No test selections yet', 'Your selected mock packages are not saved because this public preview does not use a database.', 'history', 'Choose a mock bundle')
      : state.page === 'recipients' ? emptyPage('TEST RECIPIENTS', 'Use the recipient field during testing', 'Enter a Kenyan test number on the Browse bundles screen. It is used only to preview the interface and is never submitted.', 'heart', 'Open bundle tester')
      : state.page === 'account' ? emptyPage('PUBLIC PREVIEW', 'No account is required', 'Sign-in and customer accounts are not enabled in this safe catalogue preview. You can browse and test the interface immediately.', 'user', 'Start browsing')
      : helpPage();
    app.innerHTML = shell(content);
    document.title = `${pageTitle()} | CredoConnect`;
    if (state.page === 'bundles') loadCatalogue();
  }

  app.addEventListener('click', (event) => {
    const page = event.target.closest('[data-page]');
    const category = event.target.closest('[data-category]');
    const network = event.target.closest('[data-network]');
    const action = event.target.closest('[data-action]');
    if (page) { state.page = page.dataset.page; state.menuOpen = false; render(); window.scrollTo(0, 0); return; }
    if (category) { openBundles(category.dataset.category); return; }
    const product = event.target.closest('[data-product]');
    if (product) { requestSandboxStk(product.dataset.product); return; }
    if (network) { state.network = network.dataset.network; render(); return; }
    if (action?.dataset.action === 'theme') { setTheme(state.theme === 'dark' ? 'light' : 'dark'); render(); return; }
    if (action?.dataset.action === 'open-menu') { state.menuOpen = true; render(); return; }
    if (action?.dataset.action === 'close-menu') { state.menuOpen = false; render(); }
  });
  app.addEventListener('change', (event) => {
    if (event.target.id === 'categorySelect') { state.category = event.target.value; render(); }
  });

  render();
})();
