import { useEffect, useMemo, useState } from 'react';
import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Activity, ArrowDownLeft, ArrowRight, Bell, Check, ChevronDown, CircleHelp, Clock3, Command, CreditCard, FileClock, Gift, Heart, LayoutDashboard, Menu, Moon, PackageSearch, Radio, Search, ShieldCheck, Smartphone, Sun, Users, Wifi, X } from 'lucide-react';
import './styles.css';

const NETWORKS = [
  { id: 'safaricom', name: 'Safaricom', tone: 'green', mark: 'S' },
  { id: 'airtel', name: 'Airtel', tone: 'red', mark: 'A' },
];
const CATEGORIES = [
  { id: 'data', name: 'Data bundles', icon: Wifi, copy: 'Internet for your day, week or month.' },
  { id: 'sms', name: 'SMS bundles', icon: FileClock, copy: 'Stay in touch, message by message.' },
  { id: 'voice', name: 'Voice minutes', icon: Smartphone, copy: 'Minutes for the conversations that matter.' },
];
const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/bundles', label: 'Browse bundles', icon: PackageSearch },
  { to: '/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/recipients', label: 'Saved recipients', icon: Heart },
];
const API = import.meta.env.VITE_API_URL || '/api';

function Logo({ compact = false }) {
  return <div className="brand-lockup"><div className="brand-symbol"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M28.5 12.2a13 13 0 1 0 0 15.6"/><path d="M23.6 16.8a6 6 0 1 0 0 6.4"/><circle cx="29.5" cy="10.5" r="3"/><circle cx="29.5" cy="29.5" r="3"/></svg></div>{!compact && <div className="brand-type"><strong>Credo<span>Connect</span></strong><small>Your Network. Your Bundles.</small></div>}</div>;
}

function AppShell() {
  const [theme, setTheme] = useState(() => localStorage.getItem('credo-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [network, setNetwork] = useState('safaricom');
  const [category, setCategory] = useState('data');
  const [apiState, setApiState] = useState('checking');
  const location = useLocation();
  const navigate = useNavigate();
  const selectedNetwork = NETWORKS.find((item) => item.id === network);
  const selectedCategory = CATEGORIES.find((item) => item.id === category);
  const categoryLabel = selectedCategory?.name || 'Bundles';

  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('credo-theme', theme); }, [theme]);
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    let active = true;
    fetch(`${API}/health`).then((r) => r.ok ? r.json() : Promise.reject()).then((data) => { if (active) setApiState(data.status === 'ok' ? 'connected' : 'unavailable'); }).catch(() => { if (active) setApiState('unavailable'); });
    return () => { active = false; };
  }, []);

  const pageTitle = useMemo(() => {
    if (location.pathname === '/bundles') return 'Find your next bundle';
    if (location.pathname === '/transactions') return 'Your transactions';
    if (location.pathname === '/recipients') return 'Saved recipients';
    if (location.pathname === '/account') return 'Your account';
    if (location.pathname === '/help') return 'How can we help?';
    return 'Your connection, at a glance';
  }, [location.pathname]);

  const toggleTheme = () => setTheme((v) => v === 'dark' ? 'light' : 'dark');
  const jumpToBundles = (kind = 'data') => { setCategory(kind); navigate('/bundles'); };

  return <div className="app-frame">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><Logo/><button className="mobile-close icon-button" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18}/></button></div>
      <div className="side-caption">WORKSPACE</div>
      <nav className="side-nav" aria-label="Main navigation">{NAV.map(({to,label,icon:Icon}) => <NavLink key={to} to={to} end={to === '/'} className={({isActive}) => `nav-item ${isActive ? 'nav-active' : ''}`}><Icon size={18}/><span>{label}</span>{label === 'Browse bundles' && <span className="nav-arrow"><ArrowRight size={15}/></span>}</NavLink>)}</nav>
      <div className="side-caption side-caption-gap">QUICK BUY</div>
      <div className="quick-list">{CATEGORIES.map(({id,name,icon:Icon}) => <button key={id} className="quick-item" onClick={() => jumpToBundles(id)}><span className={`quick-icon quick-${id}`}><Icon size={16}/></span><span>{name}</span><ArrowRight size={14} className="quick-arrow"/></button>)}</div>
      <div className="sidebar-spacer"/>
      <div className="support-card"><div className="support-ico"><CircleHelp size={18}/></div><strong>Need a hand?</strong><p>Our support team is here for you.</p><button onClick={() => navigate('/help')}>Visit help centre <ArrowRight size={14}/></button></div>
      <button className="account-mini" onClick={() => navigate('/account')}><span className="avatar">CC</span><span className="account-text"><strong>My account</strong><small>Manage your profile</small></span><ChevronDown size={15}/></button>
    </aside>

    <main className="main-shell">
      <header className="topbar"><button className="mobile-menu icon-button" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20}/></button><div className="crumb"><span>CredoConnect</span><span className="crumb-slash">/</span><strong>{pageTitle}</strong></div><div className="top-actions"><div className={`system-status ${apiState === 'connected' ? 'status-live' : ''}`}><span className="status-dot"/><span>{apiState === 'connected' ? 'System online' : 'Catalogue offline'}</span></div><button className="icon-button" aria-label="Notifications" title="Notifications"><Bell size={18}/><i className="notification-dot"/></button><button className="icon-button" onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><div className="top-avatar">C</div></div></header>
      <div className="page-wrap">
        <Routes>
          <Route path="/" element={<Dashboard network={selectedNetwork} status={apiState} jumpToBundles={jumpToBundles}/>}/>
          <Route path="/bundles" element={<Bundles network={network} setNetwork={setNetwork} category={category} setCategory={setCategory} selectedNetwork={selectedNetwork} selectedCategory={selectedCategory}/>}/>
          <Route path="/transactions" element={<EmptyPage icon={CreditCard} title="Your purchase history will appear here" text="Once bundle purchases are enabled, you’ll be able to follow payments, delivery status and receipts from this page."/>}/>
          <Route path="/recipients" element={<EmptyPage icon={Heart} title="Keep your favourite people close" text="Saved recipients will appear here when customer accounts are connected."/>}/>
          <Route path="/account" element={<EmptyPage icon={Users} title="Your account is being prepared" text="Profile, verification and account settings will be available when secure sign-in is connected."/>}/>
          <Route path="/help" element={<HelpPage/>}/>
          <Route path="*" element={<EmptyPage icon={Command} title="This page is on its way" text="Choose an area from the left navigation to continue."/>}/>
        </Routes>
        <footer className="footer"><span>© 2026 CredoConnect</span><span><span className="footer-live"/> Built for Kenya <span className="footer-sep">·</span> Safaricom &amp; Airtel</span><button onClick={() => navigate('/help')}>Help &amp; support</button></footer>
      </div>
    </main>
    {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
  </div>;
}

function Dashboard({network,status,jumpToBundles}) {
  const [activeNetwork, setActiveNetwork] = useState(network.id);
  useEffect(() => setActiveNetwork(network.id),[network.id]);
  return <>
    <section className="hero-panel"><div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> YOUR CONNECTION, SIMPLIFIED</div><h1>Your network.<br/><span>Your bundles.</span></h1><p>Find the right bundle for the right number. One easy place to stay connected.</p><div className="hero-actions"><button className="button-primary" onClick={() => jumpToBundles('data')}>Explore bundles <ArrowRight size={17}/></button><span className="secure-note"><ShieldCheck size={15}/> Secure checkout, coming soon</span></div></div><div className="hero-art" aria-hidden="true"><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-node node-a"/><div className="art-node node-b"/><div className="art-node node-c"/><div className="art-core"><Logo compact/><span>ONE CONNECTION</span></div><div className="signal signal-a"><Wifi size={15}/></div><div className="signal signal-b"><Radio size={14}/></div></div><div className="hero-bottom"><div><span className="bottom-label">A SIMPLE WAY TO STAY CONNECTED</span><span className="bottom-value">Two networks. Your choice.</span></div><div className="hero-network-logos"><span className="network-logo saf-mark">S</span><span className="network-logo airtel-mark">A</span></div></div></section>
    <section className="section-heading"><div><div className="eyebrow muted-eyebrow">PICK YOUR CONNECTION</div><h2>Choose a network</h2><p>Start with the number you want to top up with a bundle.</p></div><span className="section-side-label"><span className="status-dot status-dot-blue"/> 2 supported networks</span></section>
    <div className="network-grid">{NETWORKS.map((n) => <button key={n.id} onClick={() => {setActiveNetwork(n.id);jumpToBundles('data');}} className={`network-card ${activeNetwork===n.id ? `network-selected ${n.tone}` : ''}`}><span className={`network-brand ${n.tone}`}>{n.mark}</span><span className="network-info"><strong>{n.name}</strong><small>SMS · Data · Voice</small></span><span className="network-radio">{activeNetwork===n.id && <Check size={13}/>}</span></button>)}</div>
    <section className="section-heading bundle-heading"><div><div className="eyebrow muted-eyebrow">EXPLORE BY TYPE</div><h2>What do you need?</h2></div><button className="text-link" onClick={() => jumpToBundles('data')}>All bundles <ArrowRight size={15}/></button></section>
    <div className="category-grid">{CATEGORIES.map(({id,name,icon:Icon,copy}, i) => <button className={`category-card cat-${id}`} key={id} onClick={() => jumpToBundles(id)}><span className="category-number">0{i+1}</span><span className="category-icon"><Icon size={19}/></span><strong>{name}</strong><p>{copy}</p><span className="category-action">Browse category <ArrowRight size={14}/></span></button>)}</div>
    <section className="notice-strip"><div className="notice-icon"><Activity size={17}/></div><p><strong>{status === 'connected' ? 'Catalogue connection ready' : 'Bundle catalogue is being connected'}.</strong> Live products and prices will appear here after authorized provider access is configured.</p><span className="notice-tag">NO DEMO PRICES</span></section>
  </>;
}

function Bundles({network,setNetwork,category,setCategory,selectedNetwork,selectedCategory}) {
  const Icon = selectedCategory?.icon || Wifi;
  return <><section className="catalogue-intro"><div><div className="eyebrow muted-eyebrow">BROWSE CATALOGUE</div><h1>{selectedCategory?.name || 'Bundles'} <span>for your number.</span></h1><p>Compare eligible options from the network you choose.</p></div><span className="catalogue-badge"><span className="status-dot"/> Provider not connected</span></section>
    <div className="catalogue-controls"><div className="control-group"><span className="control-label">NETWORK</span><div className="segmented">{NETWORKS.map((n) => <button key={n.id} className={network===n.id?'segment-active':''} onClick={() => setNetwork(n.id)}><span className={`segment-mark ${n.tone}`}>{n.mark}</span>{n.name}</button>)}</div></div><div className="control-group"><span className="control-label">BUNDLE TYPE</span><div className="select-wrap"><select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select><ChevronDown size={15}/></div></div><label className="search-field"><Search size={17}/><input placeholder="Search bundles" disabled aria-label="Search bundles"/><span className="search-hint">Soon</span></label></div>
    <div className="catalogue-summary"><div><span className={`network-brand small ${selectedNetwork?.tone}`}>{selectedNetwork?.mark}</span><strong>{selectedNetwork?.name}</strong><span className="summary-divider"/><Icon size={16}/><span>{selectedCategory?.name}</span></div><span className="result-count">0 products</span></div>
    <div className="unavailable-panel"><div className="empty-illustration"><div className="empty-circle"><Icon size={31}/></div><span className="empty-pulse pulse-one"/><span className="empty-pulse pulse-two"/></div><div className="unavailable-pill"><span className="status-dot"/> LIVE CATALOGUE NOT CONNECTED</div><h2>We’re preparing this catalogue.</h2><p>CredoConnect will show current {selectedNetwork?.name} {selectedCategory?.name.toLowerCase()} only after an authorized provider connection is verified. We won’t show sample packages or guessed prices.</p><div className="unavailable-foot"><span><ShieldCheck size={15}/> Real products, verified availability</span><span><Clock3 size={15}/> Coming after provider setup</span></div></div>
    <div className="provider-note"><ShieldCheck size={17}/><span><strong>Your trust comes first.</strong> No payment prompt or purchase is started from this preview.</span></div>
  </>;
}

function EmptyPage({icon:Icon,title,text}) { return <div className="page-empty"><div className="empty-icon"><Icon size={23}/></div><div className="eyebrow muted-eyebrow">YOUR CREDOCONNECT</div><h1>{title}</h1><p>{text}</p><div className="coming-label"><span className="status-dot"/> IN THE WORKS</div></div>; }
function HelpPage(){return <div className="help-page"><div className="eyebrow muted-eyebrow">SUPPORT</div><h1>Help that stays connected.</h1><p>We’re building customer support and order tracking. Live purchase assistance will be added with provider integration.</p><div className="help-card"><div className="help-card-icon"><CircleHelp size={19}/></div><div><strong>Need help with this preview?</strong><p>Bundle purchases and payments are not enabled yet. No money can be charged from this site preview.</p></div></div><div className="help-card"><div className="help-card-icon"><ShieldCheck size={19}/></div><div><strong>Why are bundles unavailable?</strong><p>Actual Safaricom and Airtel catalogues require an authorized commercial provider connection. We do not invent package listings or prices.</p></div></div></div>}

function App(){return <HashRouter><AppShell/></HashRouter>}
export default App;
