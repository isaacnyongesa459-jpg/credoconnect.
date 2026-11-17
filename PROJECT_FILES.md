# Major files

| Path | Purpose |
| --- | --- |
| `client/src/App.jsx` | React route shell and current marketplace/customer screens; never embeds secret values. |
| `client/src/styles.css` | Shared brand system, responsive layout, and light/dark themes. |
| `client/src/main.jsx` | React root entry point. |
| `client/vite.config.js` | Vite setup and local `/api` proxy to Express. |
| `client/public/manus-routes.json` | Current website route manifest. |
| `server/src/index.js` | Express API boundary, security middleware, health/network endpoints, and honest unavailable purchase responses. |
| `server/prisma/schema.prisma` | PostgreSQL persistence model for identity, catalogue, orders, and payment-event tracking. |
| `server/prisma/seed.js` | Idempotently seeds the two supported network identities only, never products or prices. |
| `.env.example` | Safe names and placeholders for backend configuration; contains no credentials. |
| `plan.md`, `TODO.md` | Implementation decisions and requirement-by-requirement delivery status. |
