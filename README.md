# USIG Decision Tools Hub

Auth, metering, and billing layer for three standalone tool sites:
deals-desk.usig.ai (**Residential Analysis**), cre-analysis.usig.ai
(**Commercial Analysis**), and mortgage.usig.ai (**Financing Analysis** —
same domain, renamed product). This app does not contain any tool
calculation logic — it authenticates users, enforces monthly free-tier
limits, and handles Stripe billing, then gates the three external sites
via [`public/gate.js`](public/gate.js).

See [`INSTALL.md`](INSTALL.md) for wiring the gate + PWA config into the
three tool sites, and [`DECISIONS.md`](DECISIONS.md) for judgment calls
made where the spec was silent or (in one case) insecure as written.

## Stack

Next.js 15 (App Router, TypeScript) · Tailwind CSS · Supabase
(`@supabase/supabase-js` + `@supabase/ssr`) · Stripe · Resend · Netlify
(`@netlify/plugin-nextjs`).

## 1. Install

```bash
npm install
```

## 2. Supabase project

1. Create a project at supabase.com.
2. Run the migrations in order, either via the SQL editor or the CLI:
   - `supabase/migrations/001_init.sql` — tables, RLS, `can_run()` /
     `record_usage()`, the new-user trigger.
   - `supabase/migrations/002_storage.sql` — private
     `commercial-documents` storage bucket + RLS for Commercial Analysis
     document uploads.
3. **Authentication → Providers**: enable Email (magic link, no password)
   and Google. For Google, set the authorized redirect URI in the Google
   Cloud console to `https://<project-ref>.supabase.co/auth/v1/callback`.
4. **Authentication → URL Configuration**: Site URL =
   `https://tools.usig.ai`; add `https://tools.usig.ai/auth/callback` to
   Redirect URLs (and your local dev URL, e.g.
   `http://localhost:3000/auth/callback`, while developing).
5. Copy the project URL, anon key, and service role key into your env
   (see `.env.example`).

## 3. Stripe

Per the brief, **products and prices are created in the Stripe Dashboard,
not via the API** — this app only ever reads price IDs from env vars.

1. Create three Products, each with a monthly and an annual recurring
   Price (six prices total):

   | Product | Monthly | Annual |
   |---|---|---|
   | USIG Residential Analysis | $29.99 | $299 |
   | USIG Commercial Analysis | $99.00 | $990 |
   | USIG Financing Analysis | $49.00 | $490 |

   Paste each price ID into the matching `NEXT_PUBLIC_PRICE_*` env var.

   Financing Analysis also has a second, non-Stripe path to unlimited
   access — complimentary for loan originators who subscribe to your agent
   automation service elsewhere. That's a manual grant for now; see
   `INSTALL.md` §6 and `DECISIONS.md`.

2. **Customer Portal** (Settings → Billing → Customer portal): turn
   **on** subscription cancellation, set it to cancel **at period end**,
   turn **off** the cancellation survey, turn **off** retention offers /
   coupons, and under "Products customers can switch between" allow
   switching only between a product's own monthly and annual prices (not
   across the three different tools). This is a Dashboard setting — the
   app calls `billingPortal.sessions.create()` against your account's
   default configuration, it doesn't construct one at runtime.

3. **Webhook** (Developers → Webhooks): endpoint
   `https://tools.usig.ai/api/stripe/webhook`, subscribed to
   `checkout.session.completed`, `customer.subscription.created`,
   `customer.subscription.updated`, `customer.subscription.deleted`, and
   `invoice.payment_failed`. Copy the signing secret into
   `STRIPE_WEBHOOK_SECRET`.

No free trials are configured (see §6 of the brief / `DECISIONS.md` for
the freemium-vs-trial switch and exactly what to change if that ever
flips).

## 4. Resend

Create an API key, verify the `usig.ai` sending domain, set
`RESEND_API_KEY` and `NOTIFY_EMAIL` (where `/contact` leads are emailed).

## 5. Environment variables

Copy `.env.example` to `.env.local` and fill in every value. Everything
without a `NEXT_PUBLIC_` prefix is server-only — see `DECISIONS.md` for
how that's enforced (the `server-only` package hard-fails the build if
one of those modules is ever pulled into a client bundle).

## 6. Run locally

```bash
npm run dev
```

## 7. Deploy (Netlify)

`netlify.toml` is already configured with `@netlify/plugin-nextjs`. Point
a Netlify site at this repo, set the same env vars in Site settings →
Environment variables, and set the custom domain to `tools.usig.ai`.

## 8. Wire up the three tool sites

Everything needed to gate `deals-desk.usig.ai`, `cre-analysis.usig.ai`,
and `mortgage.usig.ai` — the gate script, PWA manifests/icons/service
worker, and the Financing Analysis compliance helpers — is in
[`INSTALL.md`](INSTALL.md) and `pwa-assets/`.

## Notes

- **PWA icons are placeholders** (solid color + initial), generated at
  the correct sizes so the manifests are valid today. Swap the files
  under `public/icons/` (hub) and `pwa-assets/*/icons/` (tool sites)
  for real artwork before launch — dimensions are documented in
  `INSTALL.md`.
- **Legal pages** (`/legal/terms`, `/legal/privacy`) contain original
  drafted copy — the brief didn't specify verbatim text for these two
  pages the way it did for marketing/email copy. Have counsel review
  before launch, particularly the California Automatic Renewal Law
  language in the Terms.
