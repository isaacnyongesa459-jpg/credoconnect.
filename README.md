# CredoConnect

**Your Network. Your Bundles. One Connection.**

CredoConnect is a Kenyan bundle marketplace for Safaricom and Airtel, limited to SMS, data, and voice-minute bundles. It must not sell airtime or other unsupported products. Live products, payments, and delivery remain disabled until authorized providers and verified payment/fulfilment integrations are available. The interface does not invent products or prices.

## Stack and project files

- `index.html`: static site entry, served by GitHub Pages and Node.
- `client/styles.css`: responsive brand system, light/dark themes, and page styles.
- `client/app.js`: plain browser JavaScript for navigation, network/category choices, and honest unavailable states.
- `client/credo-icon.svg` and `manifest.webmanifest`: logo mark and PWA metadata.
- `server/src/index.js`: Node.js/Express backend with health, network catalogue, rate limiting, security headers, and fail-closed product/order endpoints.
- `server/src/whatsapp.js`: provider-agnostic WhatsApp conversation state machine with numbered menus, natural-language intent shortcuts, session expiry, phone validation, and safe confirmation handling.
- `server/prisma/schema.prisma` plus `server/prisma/migrations/`: PostgreSQL model and initial migration.
- `TODO.md` and `plan.md`: scope, progress, and blocked provider prerequisites.

## Run locally

Requirements: Node.js 20 or newer and npm.

1. Copy `.env.example` to `.env` and set private backend values such as `DATABASE_URL` and `APP_ORIGIN` (`http://localhost:5000` for local same-origin use). Never commit `.env` or put secrets in browser JavaScript.
2. From the repository root, run `npm install`.
3. Run `npm run dev`. The Node API serves the frontend at `http://localhost:5000` and provides the `/api` routes.
4. When configuring PostgreSQL, run `npm run db:generate`; review/apply migrations only against the intended database.
5. Run API tests with `npm test`.

`GET /api/health` reports service/integration readiness. `GET /api/networks` lists only Safaricom and Airtel. `GET /api/products?network=safaricom&category=data` deliberately returns HTTP 503 and no products until a verified provider adapter exists. `POST /api/orders` is disabled until payment and delivery are verifiably connected.

## WhatsApp conversation flow

The intended customer-facing WhatsApp Business number is `+255798491209`, configured through `WHATSAPP_BUSINESS_PHONE_NUMBER`. The backend exposes `POST /api/whatsapp/messages` for JSON adapter testing and `POST /api/whatsapp/webhook` for an authorized WhatsApp provider. The webhook accepts a normalized `{ "from": "0712345678", "message": "Hi" }` payload and also recognizes the common Meta Cloud API inbound message shape. `GET /api/whatsapp/webhook` supports Meta-style verification with `WHATSAPP_VERIFY_TOKEN`; configure `WHATSAPP_WEBHOOK_SECRET` when the provider can send the matching header.

Customers can start with `Hi`, `Hello`, `Start`, or `Menu`, navigate by number, use `Back` and `Cancel`, or type requests such as “I want Safaricom data bundles.” The menu intentionally offers only CredoConnect’s supported SMS, data, and voice products; it does not offer airtime. Conversation state is stored in the `WhatsappSession` Prisma model when `DATABASE_URL` is configured and falls back to an expiring in-memory store for local tests. The response is provider-agnostic (`to`, `reply`, and `state`); an authorized WhatsApp outbound adapter still needs to deliver the reply.

The current catalogue, payment, and fulfilment integrations are not configured. Therefore the bot never invents package names/prices, initiates a charge, or reports a successful purchase. After provider onboarding, connect `getCatalogue`, payment initiation, verified callbacks, and delivery confirmation through the existing backend order lifecycle before enabling commerce.

## GitHub Pages

GitHub Pages is already configured for the public `main` branch at the repository root. The plain frontend entry at `index.html` and its `client/` assets are published automatically on pushes to `main`. The project URL is **https://isaacnyongesa459-jpg.github.io/credoconnect./**. Pages hosts only static frontend files; it does not run the Node backend. Therefore live catalogue, login, order, and payment features are not enabled on the Pages site.

## External integrations intentionally blocked

Before enabling sales, verify an authorized aggregator's commercial permissions, documentation, and actual Safaricom/Airtel SMS/data/voice product coverage, purchase workflow, and delivery callbacks. The separate Imperishable Church implementation is needed to inspect and adapt its proven Daraja flow. Use separate sandbox M-Pesa credentials first. An STK Push request alone is not proof of payment, and payment alone is not proof of bundle delivery.

## Secret hygiene

The original repository tracked an `.env` file. The rebuild removed it from the latest commit and ignores environment-specific files, but that does not erase previous Git history or invalidate credentials. Rotate any active values that may have been committed or published, and review history before production use. No prior secret values were read or copied.

## Deployment readiness

The static frontend can be viewed on GitHub Pages. The Node backend, PostgreSQL database, provider connections, customer authentication, commercial payments, fulfilment, and admin workflows are not yet deployed or production-ready. Configure backend hosting only after private service values, database migrations, provider approvals, and sandbox verification are complete.
