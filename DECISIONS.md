# Decisions

Judgment calls made while building, where the brief was silent, ambiguous,
or (in one case) specified something insecure.

## Security fix to the given schema

**`can_run()` / `record_usage()` now verify `p_user = auth.uid()`.**
As specified in the brief, both functions are `security definer` (they
run with elevated privilege, bypassing RLS) but took `p_user` as a plain
argument with no check that it matched the caller. Since `gate.js` calls
these via `sb.rpc(...)` with only the anon key + the visitor's own JWT,
any signed-in user could have passed an arbitrary UUID and either read
another user's plan/usage or recorded fake usage against their account.
Added a guard at the top of each function (`if p_user <> auth.uid() then
raise exception`) and `revoke ... from public` / `grant ... to
authenticated` so anonymous callers can't invoke them at all. This is the
one place I deviated from the literal SQL in the brief; everything else
in `001_init.sql` is verbatim.

## Cross-subdomain auth (the "most common failure point")

The brief's reference `gate.js` used the plain `supabase-js` UMD client.
That client's default session storage is `localStorage`, which is
per-origin and would **not** carry a session from `tools.usig.ai` to
`deals-desk.usig.ai` no matter what cookie `domain` you configure — you'd
need to hand-roll a cookie-backed storage adapter and reproduce
`@supabase/ssr`'s exact cookie chunking/encoding to match what the hub
writes. Instead, `gate.js` is loaded as an ES module and imports
`@supabase/ssr`'s `createBrowserClient` from a CDN — the identical
function this app's `src/lib/supabase/client.ts` uses — configured with
the same `domain: ".usig.ai"` cookie options. Same library, same cookie
format, on both ends. `INSTALL.md` §7 has a manual verification checklist
for this.

## Stripe customer reuse across products

The brief's checkout snippet always passed `customer_email`, which lets
Stripe silently create a second Customer object if a user buys a second
tool. Since the acceptance criteria requires "second tool purchase works
from one account," `/api/stripe/checkout` now looks for an existing
`stripe_customer_id` on any of the user's `subscriptions` rows and passes
`customer` instead of `customer_email` when one exists, so one Stripe
Customer covers every tool a given user subscribes to.

## Welcome email trigger

§7's route list has no signup/webhook endpoint for Supabase Auth events,
and §12.1 just says "on signup." Rather than add an undocumented route,
`/auth/callback` sends the welcome email using a heuristic: if the
signed-in user's `created_at` is within 60 seconds of "now," treat it as
a first sign-in. This is best-effort and fails open (email errors never
block sign-in) — a user who takes over a minute to click a magic link
after receiving it would still get signed in, just without triggering
this heuristic on that request (in practice the DB trigger fires
`created_at` at row-insert time, well before the user clicks anything, so
this window is generous in practice for magic-link flows and exact for
OAuth).

## `leads.name`

§11.6 lists "name" as a contact-form field, but the `leads` table in §5
has no `name` column, and the schema is given verbatim elsewhere in the
brief. Rather than alter the specified schema, the contact form still
collects a name field client-side and folds it into `message` as a
`Name: …` prefix before insert.

## Financing Analysis compliance helpers live in `gate.js`, not in a tool's codebase

§13.1's NMLS-gating and lender-name/rate restrictions describe behavior
of the Financing Analysis tool's own output — but that tool's codebase is
explicitly out of scope ("you are not touching their calculation logic").
What this app *can* own is the shared enforcement primitive: `gate.js`
exposes `window.usigRequireNmls()` and `window.usigFinancingFooter()`,
documented in `INSTALL.md` §4, for the Financing Analysis site to call
before generating and before rendering client-facing output,
respectively. Whether the tool actually calls them, and whether its own
output logic avoids naming lenders or quoting rates, remains the
responsibility of that site's own codebase.

## Product naming and Financing access model, revised after initial build

Two changes made after the app was first built and verified, at the
user's explicit request:

1. **Renamed for consistency**: "Deal Analyzer" → "Residential Analysis"
   and "Mortgage Analyzer" → "Financing Analysis" (financing covers both
   residential and business funding, which "mortgage" didn't). "Commercial
   Analysis" was already right. This is a display-name and internal
   product-key change only (`deal_analyzer`→`residential`,
   `mortgage`→`financing` in the database, route slugs, `gate.js`,
   `products.ts`) — the external tool domains (`deals-desk.usig.ai`,
   `mortgage.usig.ai`) were deliberately left unchanged, since moving a
   live domain is a bigger, riskier change than renaming what users see.
   Applied directly against the live Supabase data (not left as a future
   migration) since the product was pre-launch with only test data.

2. **Financing Analysis is not pure freemium.** The original brief
   specified freemium/paid for all three tools uniformly, but the actual
   intent is that loan originators get Financing Analysis for free as a
   perk of subscribing to a separate agent automation service — freemium
   was never quite right for this one. Landed on supporting **both**: the
   public $49/mo self-serve plan stays (revenue path for anyone), and a
   manually-granted complimentary "paid" row (`stripe_subscription_id`
   null) gives the same unlimited access for automation-service
   subscribers. No schema change was needed — `can_run()` only ever checks
   `plan='paid' and status='active'`, it doesn't care whether a Stripe
   subscription produced that row. The manual grant/revoke SQL is in
   `INSTALL.md` §6. **Not yet automated**: there's no integration with the
   automation service itself, so someone has to run that SQL by hand today.
   Worth revisiting once that service exists — most likely a webhook from
   it (or a shared Supabase table) that upserts the same row
   `can_run()` already reads, rather than new gating logic in this app.

## Design

Accent color: deep forest green (`#0b3d2e`) — the brief offered "navy or
forest." Font: Inter via the system stack fallback (no font file
bundled, to keep the build dependency-free).

## PWA icons

Generated locally as solid-color placeholders (brand color background,
single-letter mark) at the exact required dimensions (192/512, plus
maskable variants with the mark scaled into the safe zone) rather than
left as broken references — the manifests are valid and installable
today. Real artwork should replace them before launch; see `INSTALL.md`.

## Known accepted limitation: `npm audit` flags inside `next` itself

`npm audit` reports 3 high-severity issues in `postcss` and `sharp`. Both
live under `node_modules/next/node_modules/...` — vendored copies `next`
bundles for its own internal build tooling and its `next/image` optimizer,
not the top-level `postcss` this project uses for Tailwind (8.5.23,
unaffected). This app never imports `next/image`, so the `sharp` path is
unreachable at runtime, and the `postcss` path only ever processes this
repo's own trusted source files, never attacker-controlled CSS. 15.5.22 is
the newest Next 15.x release as of this writing; there's no newer 15.x
patch that resolves it — only Next 16 does, which is a bigger migration.
Did not do that unilaterally; revisit when there's room to test a major
version bump. Do **not** run `npm audit fix --force` — it proposes
downgrading to `next@9.3.3`, a pre-App-Router release from years before
this codebase, which would break the entire app.

## Known accepted limitation: `can_run` + `record_usage` race

Both the hub's `/api/usage/record` and `gate.js`'s
`usigCheckAndRecord()` call `can_run()` then `record_usage()` as two
separate round-trips rather than one atomic check-and-increment. A user
firing many concurrent requests could exceed their monthly limit by a
small, bounded amount. This mirrors the exact RPC contract given in the
brief (§5); tightening it would mean changing the specified function
signatures, which felt like more deviation than the risk (a free-tier
user running a handful of extra analyses) warranted. Worth revisiting
with a single combined RPC (`select ... for update` inside one function)
if usage-limit precision ever matters more than it does for a freemium
gate.
