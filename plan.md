# CredoConnect implementation plan

## Objective

Build CredoConnect as a Kenyan marketplace for Safaricom Kenya and Airtel Kenya, limited to SMS, data, and voice-minute bundles. Do not sell airtime. Customers may eventually buy for themselves or another recipient, with verified M-Pesa payment, provider-confirmed delivery, transaction history, notifications, and admin tools. Never represent fabricated packages, prices, payment completions, or deliveries as live.

## Current implementation and constraints

The frontend is plain HTML, CSS, and browser JavaScript with no build step. GitHub Pages serves the root `index.html` and public `client/` assets. The Node.js/Express backend serves the same frontend and exposes a small API. PostgreSQL/Prisma foundations are present. The current frontend is an honest storefront prototype: navigation, network/category choices, theme preference, responsive styling, and unavailable catalogue states. The API advertises only Safaricom and Airtel and fails closed for product and order operations until integrations are verified.

A verified commercial provider connection for real Safaricom/Airtel products, payment and fulfillment is not available. The existing Imperishable Church Daraja implementation and separate sandbox credentials also remain prerequisites for M-Pesa implementation. Therefore no live catalogue, payment, fulfillment, authentication, or admin capability is claimed. GitHub Pages only hosts static files; it does not run the Node backend.

## Phased implementation

1. **Foundation:** maintain the plain static frontend and Node/Express backend boundary; keep static serving restricted to `index.html` and `client/`; retain security middleware and safe API behavior; document setup and secret hygiene.
2. **Storefront experience:** progressively build the landing, registration/login, customer dashboard, SMS/data/voice catalogue and checkout/status, transaction, receipt, profile, notification, help, and admin page families using plain HTML/CSS/JavaScript. Keep light/dark mode, mobile responsiveness, accessibility, and a consistent vector identity. Display unavailable states until integrations are verified.
3. **Identity and durable data:** add secure authentication, role controls, account lifecycle, validation, auditability, and PostgreSQL/Prisma models and migrations. Keep secrets server-side and implement appropriate rate limiting, session handling, and protection against abuse.
4. **Verified provider catalogue and fulfillment:** only after documentation, commercial authorization, and credentials are supplied, implement separate Safaricom and Airtel adapters, current catalogue refresh/cache, eligibility, purchase, callbacks, and delivery status. Do not assume products are equivalent across networks.
5. **M-Pesa and order lifecycle:** inspect the authorized Imperishable Church implementation before adapting it. Use Daraja sandbox credentials/endpoints first. Implement durable pending orders, validated STK initiation, authenticated callback processing, idempotency, status verification/reconciliation, timeouts, safe retries, and controlled refund investigation. An initiated prompt is not proof of payment; payment is not proof of delivery.
6. **Notifications, transactions, and receipts:** send purchase confirmation only after provider-confirmed delivery; retain successful orders if notification sending fails and retry safely. Add transaction search/filter/details, receipts, status tracking, and in-app notifications.
7. **Administration and support:** add role-protected customer, transaction, network, product, fee/promotion, refund, API-health, reporting, and audit workflows, plus customer support/complaint handling.
8. **Verification and deployment preparation:** test the application and integration paths in non-production/sandbox environments. Document exact configuration and migration commands. GitHub Pages is for the static frontend only; deploy the Node backend and PostgreSQL separately after required approvals, credentials, and sandbox validation.

Work outcome by outcome. Do not relax the requirements that external dependencies be verified, products be real, and success/delivery states be backed by valid confirmations. Do not deploy or enable production commerce with missing credentials or provider authorization.

## Design direction

Use a modern fintech identity: deep navy with electric blue, teal, fresh green, white, and soft neutral gray; light and dark themes; restrained gradients, strong contrast, clear status colors, and mobile-first layouts. Use a distinctive C mark with two linked signal/communication elements for navigation, favicon, and PWA use. Keep transaction states and unavailable integrations explicit rather than visually implying success.

## Project structure

```text
index.html                 Static entry for GitHub Pages and Express
client/app.js              Plain browser JavaScript and interaction state
client/styles.css          Responsive design system, themes, and layouts
client/credo-icon.svg      Vector brand/favicon mark
manifest.webmanifest       PWA metadata with project-relative paths
server/src/index.js        Express API and safe static frontend serving
server/prisma/             PostgreSQL schema, migrations, and seed
server/src/index.test.js   Node API safety/contract tests
README.md                  Setup, environment, Pages, and backend boundaries
.env.example               Safe environment-variable names/placeholders
TODO.md                    Requirements and implementation status
```
