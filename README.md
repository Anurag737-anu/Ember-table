# Ember & Table

A full-stack restaurant implementation with a depth-based food carousel inspired by the supplied reference. Fictional Mumbai restaurant data, not a live restaurant or a claim of production certification.

## Start locally

Prerequisites: Node.js 22+, npm, Docker with Compose.

```sh
cp .env.example .env
# Edit SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD first.
docker compose up -d --wait
npm install
npx prisma generate
npm run db:push
npm run db:seed
npm run dev
```

Customer website: http://localhost:5173
Admin: http://localhost:5173/#admin (sign in using your configured seed administrator).
Create a customer account using any example.test address and a password of at least 12 characters. No email service is needed for demo registration. Delivery PINs: 400050 / 400051 / 400052. Coupon EMBER10 gives 10% off a subtotal of at least INR 500, capped at INR 150.

In development DEMO_MODE=true enables simulated payments, in-app notifications and password-reset links in the server console. It does not simulate authentication or persistence: users, orders and bookings are genuinely stored in PostgreSQL. Demo payments are labelled DEMO_PAID, never PAID. Production startup rejects DEMO_MODE=true.

## Structure

```text
ember-table/
  src/
    App.tsx                    Customer routes, 3D-style carousel, chat
    main.tsx                   React entry
    styles.css                 Responsive premium design system
    types.ts                   Shared frontend types
    lib/api.ts                 Credentialed requests, money formatting
    components/Commerce.tsx    Auth, customizations, cart, checkout, account
    components/Admin.tsx       Lazy-loaded operations dashboard
  server/
    index.ts                   Validated API, sessions, access control
    services.ts                PostgreSQL, payments, email worker
  shared/core.mjs              Pure money, availability, transition logic
  prisma/schema.prisma         Relational data model and indexes
  prisma/seed.ts               Repeatable demo seed
  tests/                      Unit, source checks, opt-in API checks
  e2e/                        Playwright customer-flow tests
  docs/                       Architecture, service setup, launch checklist
  public/media/README.md       Video asset instructions
  docker-compose.yml          Local PostgreSQL
  .env.example                Secrets and configurable services
```

## Included flows

- Customer home, searchable/category/vegetarian/price-filtered menu, editable dish options, allergy notes, favorites, cart persistence, server-computed pricing, coupons and multi-step checkout.
- Durable accounts with hashed passwords, opaque server-side sessions, password reset, saved addresses and private order/reservation history.
- Cash, explicitly simulated demo payments, live Razorpay create/verify/capture verification, pending-payment recovery from account and administrator full refunds.
- Order status changes in admin reflect in the customer account by 10-second polling. Server-enforced transitions prevent skipping kitchen stages.
- Tables allocated for 90-minute slots with an atomic transaction and lock preventing concurrent double booking. Availability, confirmation, customer cancellation and staff completion/no-show handling.
- Database-grounded concierge. Without a key it uses deterministic menu filters; with an OpenAI key it classifies intent while factual answers remain server-generated. It cannot autonomously book, spend money or access another customer's data.
- Role-gated admin orders, reservations, menu and options, categories, customers, review moderation, coupon management, payment refunds and restaurant settings.
- Verified-delivery review submission. In-app notifications; queued email dispatch with provider idempotency keys when configured.
- Gallery with large dish previews, about/contact, newsletter persistence, neighborhood Maps placeholder / real Maps embed with a key, labelled demo policy pages.

## Visual treatment

Olive/cream palette, serif editorial typography, cinematic ambient motion, large floating food plates, layered carousel positions, depth blur, soft shadows and animated theme changes. These are CSS 3D transforms applied to food photography, **not** interactive volumetric food models. A motion control and reduced-motion support are included.

The fallback is an animated atmospheric background. An actual video clip is not included: set VITE_HERO_VIDEO=/media/kitchen.mp4 and add your licensed clip. Photos are remote Unsplash demo images, not verified restaurant assets. Replace and optimize them before delivery to a client.

## Tests and build

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
# In another terminal, with npm run dev already running:
RUN_INTEGRATION=true npm test
```

See TEST-REPORT.md for exactly which checks were executed during generation. The archive contains runnable tests, not a claim that browser, TypeScript, Prisma or live-provider checks have passed.

## Serve a build

```sh
npm run build
# Set APP_ORIGIN to the exact public HTTPS origin and configure all live services.
NODE_ENV=production DEMO_MODE=false npm start
```

The Node server serves dist and /api on PORT (default 3001). For a local build check with cookies on HTTP, keep NODE_ENV=development and APP_ORIGIN=http://localhost:3001. In production use HTTPS, managed PostgreSQL, a pinned lockfile and reviewed migration files. Do not use the Compose password or db:push for production schema changes.

## Scope and remaining work

This is substantial connected source code, not a hosted service or an audited production release. Advanced capabilities not implemented include real 3D models, OAuth, image uploads/storage, loyalty points, SMS/WhatsApp, BOGO/offer CMS, persisted AI conversations, full AI meal-combination optimization, reservation rescheduling/reminders, configurable slot schedules, exhaustive analytics/pagination and deployment-specific SEO prerendering. Complete the launch checklist before using real customer or payment data.
