# Major files

| Path | Purpose |
| --- | --- |
| `index.html` | Static frontend entry, used by GitHub Pages and served by Express. |
| `client/app.js` | Plain browser JavaScript for navigation, themes, network/category selection, and safe unavailable states. |
| `client/styles.css` | Responsive design system, light/dark themes, and mobile layouts. |
| `client/credo-icon.svg` | Vector C/signal brand mark. |
| `manifest.webmanifest` | Installable web-app metadata with relative Pages paths. |
| `server/src/index.js` | Node/Express API, frontend serving, security middleware, and disabled commerce endpoints. |
| `server/prisma/schema.prisma` | PostgreSQL model for user, network, product, order, and payment-event foundations. |
| `server/prisma/migrations/` | Database migration history. |
| `server/prisma/seed.js` | Idempotent Safaricom/Airtel network seed only; no fabricated products. |
| `.env.example` | Safe environment-variable names and placeholders. |
| `plan.md`, `TODO.md` | Implementation direction and requirement-by-requirement progress. |
