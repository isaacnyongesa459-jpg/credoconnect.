# CredoConnect

**Your Network. Your Bundles. One Connection.**

CredoConnect is being rebuilt as a Kenyan bundle marketplace for Safaricom and Airtel, limited to SMS, data, and voice-minute bundles. The application is intentionally not selling products yet: current catalogue and order APIs clearly return unavailable states until authorized provider APIs and verified fulfilment/payment workflows are connected. The UI does not invent products, prices, transactions, or successful deliveries.

## Current implementation

- `client/` is the React 18, Vite, JavaScript, React Router, Axios, Lucide, and Tailwind frontend. Its current overview, catalogue, transactions, saved-recipient, account, and help routes share responsive light/dark branding.
- `server/` is the Express REST API. It includes security headers, origin-restricted CORS, rate limiting, health status, Safaricom/Airtel-only network metadata, input validation, and explicit 503 responses for unavailable products and purchases.
- `server/prisma/schema.prisma` describes PostgreSQL users, networks, products, orders, idempotency references, payment events, and favourite recipients. No fabricated bundle products are seeded.
- `plan.md` and `TODO.md` record scope, sequencing, and blocked external prerequisites.

## Requirements

- Node.js 20 or newer
- Corepack and pnpm 10.4.1
- PostgreSQL for persistence work

## Local development

1. Copy `.env.example` to `.env` for local backend configuration, then set a private `DATABASE_URL` and `APP_ORIGIN`. Never commit `.env` or put credentials in frontend `VITE_` values.
2. Install dependencies with `corepack pnpm install`.
3. Start the API and frontend with `corepack pnpm dev` (frontend on Vite's default port 5173; API on port 5000).
4. Create a Prisma client with `corepack pnpm db:generate` after setting `DATABASE_URL`.
5. Create and review a migration before applying it; do not use production data for experiments.
6. Build the frontend with `corepack pnpm build`.

`GET /api/health` reports the service and integration readiness. `GET /api/networks` lists the only supported networks. `GET /api/products?network=safaricom&category=data` deliberately returns HTTP 503 and no products until an authorized catalogue adapter is implemented. `POST /api/orders` is similarly disabled until verified payments and delivery exist.

## External integrations intentionally blocked

Before enabling commercial sales, obtain and verify authorized aggregator documentation, commercial permissions, and credentials for actual Safaricom/Airtel SMS, data, and voice products; verify eligibility, catalogue freshness, purchasing, callbacks, and delivery confirmation. Separately provide access to the Imperishable Church implementation so its working Daraja STK Push, access-token, password, and callback handling can be inspected and adapted. Start M-Pesa work with separate sandbox credentials. An STK Push initiation alone must never be treated as payment, and a payment alone must never be treated as delivery.

## Secret hygiene

The prior repository tracked an `.env` file. This rebuild removes it from the working tree and ignores `.env` and other environment-specific files, with `.env.example` as the only permitted exception. Removing the file in a new commit will not erase earlier Git history or invalidate credentials; rotate any active credentials that may ever have been committed or published, and review repository history before production use. No existing environment values are copied into this codebase.

## GitHub Pages frontend

The `.github/workflows/pages.yml` workflow builds `client/` on pushes to `main` and deploys the static artifact to GitHub Pages. Vite uses the repository name as the project-site base path, and hash routing avoids Pages server rewrite requirements. The Pages site serves the frontend only; the API is not deployed there, so catalogue and purchase functions remain unavailable. Do not put API credentials or other secrets in frontend configuration.

GitHub Pages must be configured to use **GitHub Actions** as its build and deployment source. Once the workflow completes, the project site URL follows `https://<owner>.github.io/<repository>/`.

No backend production service or provider integration has been deployed or verified. Configure Render, managed PostgreSQL/Neon, and provider connections separately after the required service settings, migrations, approvals, and sandbox validation are ready. This repository does not claim commercial readiness.
