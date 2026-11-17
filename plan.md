# CredoConnect implementation plan

## Objective

Evolve the existing CredoConnect repository into a secure Kenyan telecom-bundle marketplace for Safaricom Kenya and Airtel Kenya. Support SMS, data, and voice-minute bundles only; customers may buy for themselves or another recipient, with M-Pesa payment, provider-confirmed delivery, reliable transaction history, notifications, admin tools, and responsive light/dark interfaces. Do not represent fabricated packages, prices, payment completions, or deliveries as live.

## Current repository and constraints

The checked-out repository currently contains a static `index.html` / `script.js` / `style.css` application and an Express backend using `pg`. The UI currently includes airtime, which is expressly out of scope. The backend has direct Daraja STK Push code and a callback that logs data, but inspection indicates no durable purchase lifecycle sufficient to assert payment or delivery. A separate `src/controllers/mpesaController.js` also exists and should be reconciled before any payment refactor. A `.env` file is tracked; treat it as sensitive, never read or copy its values, and make removal/credential rotation a priority. The target React/Vite/Tailwind/React Router/Axios/Lucide, Express, PostgreSQL/Prisma stack is not yet present.

Two essential external dependencies are unavailable: (1) verified documentation, commercial authorization, and credentials for a Kenyan aggregator with actual Safaricom/Airtel SMS, data, and voice products and fulfillment; (2) access to the Imperishable Church project so its working Daraja implementation can be reviewed and adapted. Accordingly, no live purchase, product availability, successful delivery, or reuse of the reference payment implementation will be claimed until those dependencies are supplied and tested. M-Pesa may be implemented only after the reference implementation and separate sandbox credentials/configuration are available.

## Phased implementation

1. **Foundation and risk cleanup:** preserve useful behavior, remove out-of-scope airtime affordances, document environment configuration, and establish a maintainable React/Vite/Tailwind frontend plus Express/PostgreSQL/Prisma backend boundary. Address the tracked `.env` safely without exposing its contents; flag already-published credentials for rotation by their owner.
2. **Brand and user experience:** build the landing, registration/login, customer dashboard, SMS/data/voice catalogue and checkout/status, transaction, receipt, profile, notification, help, and admin route families. Keep light/dark mode, system preference, persistence, mobile responsiveness, accessible interaction, and consistent vector identity. Product displays must show an explicit unavailable/not-connected state until an authorized live catalogue exists; never seed fake inventory.
3. **Identity and durable data:** introduce validated registration/authentication, secure password hashing, roles, account controls, and PostgreSQL/Prisma models with constraints and migrations. Keep secrets server-side and implement rate-limiting, validation, auditability, and safe session/token handling.
4. **Provider catalogue and fulfillment:** after documentation, authorization, and credentials are provided, implement isolated Safaricom and Airtel provider adapters, actual catalogue refresh/cache, eligibility and availability, purchase, callback, and delivery status. Do not assume equivalent products across networks.
5. **M-Pesa and order lifecycle:** inspect the authorized Imperishable Church implementation before adapting it. Use Daraja sandbox credentials/endpoints first. Model pending orders and payments durably; implement STK initiation, authenticated/validated callback processing, idempotency, status verification/reconciliation, timeouts, safe retries, and controlled refund investigation. An initiated prompt is not proof of payment; payment is not proof of fulfillment.
6. **Notifications, customer transactions, and receipts:** send SMS purchase confirmations only after provider delivery confirmation; retain successful orders if notification sending fails and safely retry without duplicates. Add transaction search/filter/details, receipts, status tracking, and in-app notifications.
7. **Administration, support, and analytics:** add role-protected customer, transaction, network, product, fee/promotion, refund, API-health, reporting, and audit workflows, plus support/complaint handling.
8. **Verification and deployment preparation:** verify the project’s behavior and integration paths in non-production/sandbox environments, document exact configuration and migration commands, prepare the requested GitHub/Render/Neon/Vercel deployment guidance, and do not claim external services work until actually tested.

Work outcome by outcome. Do not silently relax the requirements that external dependencies be verified, products be real, and success/delivery states be backed by valid confirmations. Do not deploy or publish a production integration with missing credentials or provider authorization.

## Design direction

Use the requested modern fintech identity: deep navy with electric blue, teal, fresh green, white, and soft neutral gray; light and dark themes; restrained gradients, strong contrast, clear status colors, and mobile-first layouts. Build a distinctive C mark with two linked signal/communication elements for use in navigation, auth, dashboard, favicon, and PWA icon. Use coherent typography, spacing, and iconography. Keep transaction states and unavailable integrations explicit rather than visually implying success.

## Proposed structure

```text
client/                  React + Vite + JavaScript + Tailwind application
  src/app/                route tree, layouts, guards
  src/components/         shared navigation, theme, forms, status UI
  src/features/           auth, catalogue, checkout, orders, notifications, admin
  src/lib/                Axios client, formatting, Kenyan phone utilities
  public/                 route manifest, favicon, PWA assets
server/                   Express REST API, JavaScript
  src/config/              environment and database configuration
  src/middleware/          authentication, authorization, validation, rate limits
  src/modules/              auth, networks, products, orders, payments, notifications, admin
  src/providers/            Safaricom/Airtel adapter boundaries; no fake live adapter
  prisma/                  schema and migrations
  tests/                   unit/integration tests with explicit sandbox/test doubles
README.md                  setup, environment names, migration/deployment instructions
.env.example                names and safe placeholders only
```

The inspected repository does not yet follow this split; migration should be incremental and retain only verified, useful behavior. No change should break database/deployment configuration without an explicit migration path.