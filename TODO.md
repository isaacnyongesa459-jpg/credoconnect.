# CredoConnect delivery outcomes

Status meanings: **Not started**, **In progress**, **Blocked**, **Complete**. Complete only with evidence that the outcome exists and works; provider-dependent items remain blocked until the required authorized materials and access are supplied.

## 1. Supported marketplace scope — In progress
- The platform exclusively supports Safaricom Kenya and Airtel Kenya; remove references, integrations, configurations, and user-interface options relating to Telkom, Equitel, Faiba, or any other telecommunications network.
- Sell SMS, internet/data, and voice-minutes bundles; do not include airtime purchasing as a product category.
- Customers can purchase packages for their own phone numbers or other recipients.
- Network selection contains only Safaricom and Airtel, and does not display products belonging to unsupported networks.
- Automatically identify a network from a phone number where reliable and allow manual correction.

## 2. Brand, navigation, accessibility, and PWA — In progress
- Use the tagline “Your Network. Your Bundles. One Connection.”
- Provide a modern, professional, mobile-first fintech telecommunications marketplace, with deep navy, electric blue, teal, fresh green, white, and soft neutral gray; consistent typography, spacing, icons, and components; restrained gradients; and clear contrast.
- Provide a distinctive vector-style CredoConnect logo incorporating a modern C and two connected signal/communication elements, suitable for navigation, login/registration, customer/admin dashboards, mobile screens, favicon, and PWA icon.
- Provide both light and dark themes on all pages; include a theme toggle, persistent preference, system theme detection, proper contrast, and readable elements.
- Provide mobile-responsive navigation, accessibility improvements, and an installable progressive web application experience.

## 3. Required customer and admin pages — In progress
- Provide landing; registration; login; customer dashboard; SMS, data, and voice bundle pages; package details/checkout; M-Pesa payment status; transaction history; transaction receipt; customer profile; notifications; and help/support pages.
- Provide separate admin login, admin dashboard, customer management, transaction management, product/network management, and reports pages.
- Ensure all pages share the consistent design system and support both light and dark themes.

## 4. Customer identity and account security — Not started
- Registration fields: full name, phone number, email address, password, confirm password, and terms-and-conditions acceptance.
- Implement registration, secure login/logout, phone-number verification, OTP verification, password reset, profile management, password changes, session management, account suspension, and account reactivation.
- Hash passwords with bcrypt or Argon2; protect accounts against brute-force attempts and unauthorized access.
- Never store customer M-Pesa PINs; never expose provider credentials, M-Pesa consumer secrets/passkeys, database passwords, or JWT secrets.

## 5. Customer dashboard, recipients, and support — Not started
- Show customer name/account information; Safaricom and Airtel shortcuts; buy SMS/data/voice actions; recent purchases and transaction history; favourite recipients; notifications; customer support; and promotions where available.
- Show total, successful, pending, and failed purchase summaries.
- Do not introduce a customer wallet unless properly implemented and legally authorized.
- Support favourite recipients, quick repeat purchases, recently purchased packages, searchable catalogue, package comparison, and customer complaint/support management.

## 6. Verified dynamic product catalogue — Blocked: provider documentation/authorization/credentials required
- Integrate legitimate telecommunications APIs or authorized Kenyan airtime/bundle aggregators capable of supplying Safaricom and Airtel products; verify documentation, API access, commercial permissions, and actual product coverage before implementing an integration.
- Retrieve actual Safaricom and Airtel SMS, data, and voice-minute bundles; actual prices, validity periods, eligibility, availability, and delivery status; initiate purchases and receive provider callbacks where supported.
- Dynamically refresh catalogue information using provider APIs and maintain a controlled performance cache.
- Each product contains product ID, network, package name/category/quantity, KES price, validity, eligibility requirements, availability status, last catalogue update, and provider reference.
- Filter by network, SMS/data/voice category, price, and validity period.
- Display all eligible provider-returned packages; do not limit a supported catalogue to a few manually selected packages.
- Do not fabricate packages, prices, availability, or network equivalence. Until verified integration is available, show a clear unavailable/not-connected state rather than fake live products.

## 7. SMS, data, and voice purchase experiences — Blocked for live sale by provider integration
- SMS: select Safaricom/Airtel, enter recipient, retrieve actual SMS products, display quantities/prices/validity, select, review, pay with M-Pesa, and receive the purchased bundle.
- Data: select Safaricom/Airtel, enter recipient, view and compare actual product prices/quantities/validity, select, confirm, pay with M-Pesa, and track delivery; distinguish daily/weekly/monthly/time-limited/other products where supported; do not assume identical network products.
- Voice: select Safaricom/Airtel, display actual package name/minutes/price/validity/calling destinations or restrictions/availability, and purchase eligible provider-returned products.
- Provide safe order validation and package availability checking before payment.

## 8. M-Pesa Daraja integration and order lifecycle — Blocked: Church implementation access and sandbox credentials/config required
- Before implementing CredoConnect payments, inspect the existing Imperishable Church website Node.js/Express M-Pesa STK Push implementation, access-token generation, password generation, callback handling, and environment-variable configuration; reuse/adapt the proven approach rather than creating a different architecture.
- Preserve the established variable names DATABASE_URL, MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, and MPESA_SHORTCODE; use separate app credentials/callback configuration as needed and keep all credentials backend-only.
- Use Daraja sandbox credentials and sandbox endpoints for initial testing.
- Implement OAuth token generation, STK Push, customer phone and transaction amount validation, persistent checkout/order tracking, HTTPS callback URL, callback processing, payment status verification, transaction reconciliation, timeout handling, duplicate-callback protection, and idempotency.
- Workflow: verify package availability; validate recipient; create pending order; initiate STK Push; customer enters PIN; Safaricom callback arrives; verify and record payment; initiate package delivery; receive valid provider delivery confirmation; update transaction; send customer confirmation SMS.
- Never mark an order paid merely because STK Push was initiated; never mark a package delivered before valid delivery confirmation.
- Handle delayed/duplicate callbacks, provider downtime/timeouts, failed payment, successful payment with delayed delivery, insufficient provider balance, invalid numbers, concurrent purchases, duplicate delivery attempts, and failed notifications.
- Never charge twice for the same order. If payment succeeds but delivery fails, use controlled retries and refund investigation.

## 9. Provider fulfillment and customer notifications — Blocked for live fulfillment by provider integration
- Implement network-specific provider adapters so products are independently retrieved and processed; implement actual purchase initiation, delivery status, and callbacks where supported.
- Send successful purchase-confirmation SMS only after confirmed delivery; include greeting where available, network, package, quantity, recipient, paid amount, transaction reference, validity where available, and thank-you message.
- Provide separate confirmation templates for SMS, data, and voice purchases.
- Support notifications for successful/failed payment, pending/failed delivery, and refund processing.
- If notification sending fails, retain the purchase as successful and retry safely; prevent duplicate confirmation messages.
- Implement in-app notifications, and email notifications where configured.

## 10. Durable transactions, receipts, and reconciliation — Not started
- Every order has a unique transaction reference and traceable financial records that prevent unauthorized modification.
- Store transaction/customer IDs, network, product category/name/quantity, recipient, purchase amount, service fees, total payment, M-Pesa/provider references, payment and delivery statuses, transaction time, and completion time.
- Support pending payment, payment initiated, payment successful/failed, processing delivery, successfully delivered, delivery failed, refund pending, refunded, and requires manual review states.
- Customers can view, search, filter, and inspect their transactions; download receipts; and track purchase progress.
- Implement persistent order states, safe retries, and reconciliation between M-Pesa payments and provider delivery records.

## 11. Administrator tools and analytics — Not started
- Admin overview shows total/active customers, total purchases, successful/pending/failed transactions, total sales/revenue, and network performance.
- Customer management supports view/search/profile/transactions, suspension, and reactivation.
- Transaction management supports all purchases, search by reference/phone, filters by network/category/date/payment status, failed-delivery investigation, and authorized refunds.
- Network management supports Safaricom/Airtel enable/disable, API connectivity, available packages, and provider performance.
- Product management supports viewing SMS/data/voice products, prices and availability, permitted fees, and promotions.
- Reports cover daily/weekly/monthly sales, network comparison, category sales, revenue, and failed transactions.
- Log sensitive administrative actions; provide admin analytics, API-health monitoring, provider-response logging, and transaction investigation.

## 12. Promotions and advanced workflows — Not started
- Support permitted service fees, promotional discounts/coupon codes, and referral system without misrepresenting product prices.
- Provide real-time purchase-status updates, quick repeat purchase, searchable package catalogue, package comparison, advanced transaction filters, customer support/complaints, automated reconciliation, failed-transaction investigation, and safe retries.

## 13. REST API and backend boundaries — In progress
- Organize REST modules for authentication; networks; products; orders; payments; notifications; transactions; and admin, with suitable status codes, authentication, validation, and centralized error handling.
- Required endpoint families include POST /api/auth/register, /login, /logout, /verify-otp, /forgot-password; GET /api/networks and /api/networks/:id/products; GET /api/products, /:id, /:id/availability, /refresh-status; POST /api/orders/validate and /api/orders; GET /api/orders and /:id; POST /api/payments/stk-push and /callback; GET /api/payments/:id/status; GET /api/notifications and POST /api/notifications/read; GET /api/transactions and /:id; GET /api/admin/dashboard, /users, /transactions, /reports; PATCH /api/admin/networks/:id and /products/:id.
- Keep frontend, backend, database, and external integrations properly separated.

## 14. PostgreSQL and Prisma persistence — In progress
- Use PostgreSQL and Prisma ORM with appropriate foreign keys, indexes, unique constraints, database transactions, and migrations.
- Provide models for Users, Roles, CustomerProfiles, Networks, Products, ProductCategories, ProductCatalogueUpdates, Orders, OrderItems, Payments, ProviderTransactions, Notifications, SMSLogs, FavouriteRecipients, Promotions, Coupons, Refunds, AdminAuditLogs, ProviderConfigurations, and SystemSettings.

## 15. Security and reliability — Not started
- Implement secure authentication; password hashing; role-based access control; input validation; API rate limiting; HTTPS; secure cookies; CORS; CSRF protection where applicable; SQL injection and XSS protection; webhook verification; idempotency keys; secure environment variables; audit logs; and duplicate payment/delivery protection.
- Keep credentials exclusively in backend environment variables. Never expose M-Pesa consumer secrets/passkeys, provider API credentials, database passwords, or JWT secrets.

## 16. Technology stack — In progress
- Frontend: plain HTML, CSS, and browser JavaScript; responsive mobile-first design with no framework or frontend build step.
- Backend: Node.js, Express.js, JavaScript, REST API, secure JWT or session-based authentication.
- Database: PostgreSQL and Prisma ORM.
- Payments: Safaricom M-Pesa Daraja API, STK Push, callbacks, transaction verification, sandbox testing.
- Deployment preparation: GitHub source, Render backend, Neon PostgreSQL or managed PostgreSQL, Vercel or suitable static hosting; preserve useful existing functionality and avoid breaking database/deployment configurations without a migration path.

## 17. Environment hygiene and setup docs — In progress
- Include `.env.example` with variable names and safe placeholders only; never include secrets.
- Keep credentials server-side; document environment setup and deployment instructions, including database migrations.
- The current Git repository tracks a `.env` file. Do not read or echo its values. Stop tracking secrets, ensure ignore rules prevent re-addition, and advise credential rotation if the file ever contained active/published credentials.
- Explain the purpose of each major file and do not claim an integration works until tested.

## 18. Verification and deployment readiness — Not started
- Test registration/login/logout, phone validation, network selection, dynamic catalogue retrieval, SMS/data/voice purchases, M-Pesa STK Push, successful/failed/duplicate callbacks, delivery, confirmation SMS, refunds, admin permissions, transaction history, both themes, mobile responsiveness, and security.
- Use sandbox environments for M-Pesa; simulated provider responses only in clearly identified development environments.
- Prepare deployment instructions for GitHub, Render, Neon PostgreSQL, and Vercel/suitable frontend hosting. Do not deploy a live commercial flow without verified providers, credentials, and end-to-end sandbox validation.
