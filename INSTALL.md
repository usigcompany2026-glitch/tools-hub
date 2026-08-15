# Installing the gate on the three tool sites

This covers what to add to each of the three existing, standalone Netlify
sites — **deals-desk.usig.ai** (Residential Analysis), **cre-analysis.usig.ai**
(Commercial Analysis), and **mortgage.usig.ai** (Financing Analysis — the
domain kept its original name, only the product's display name changed) —
to wire them into the hub's auth, metering, and billing. None of it touches
those sites' calculation logic.

## 1. Add the gate script

Add this to the `<head>` of every page that runs the tool, **before** any
of your own tool script tags, and **after** the point where your tool's UI
markup exists in the DOM (the gate looks for `#usig-tool` on load):

```html
<script>
  window.USIG_PRODUCT = "residential"; // "residential" | "commercial" | "financing"
  window.USIG_SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
  window.USIG_SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
  // window.USIG_HUB_URL = "https://tools.usig.ai"; // optional, defaults to this
</script>
<script type="module" src="https://tools.usig.ai/gate.js"></script>
```

Use `USIG_PRODUCT` = `"residential"` on deals-desk.usig.ai, `"commercial"`
on cre-analysis.usig.ai, `"financing"` on mortgage.usig.ai.

`gate.js` is loaded with `type="module"` — it imports `@supabase/ssr`'s
browser client from a CDN so the auth cookie it writes is byte-for-byte
compatible with the cookie the hub's Next.js app reads. Do **not** load the
plain `@supabase/supabase-js` UMD bundle alongside it; it isn't needed and
its default `localStorage` session storage won't be shared with the hub.

The inline `<script>` setting `window.USIG_*` must appear **before** the
`<script type="module">` tag in document order — module scripts are
deferred, so the classic script above it always runs first.

## 2. Wrap your tool's UI

Wrap the tool's interactive markup in a container that starts hidden. The
gate reveals it once the visitor is confirmed signed in:

```html
<div id="usig-tool" style="display:none">
  <!-- your existing tool UI, untouched -->
</div>
```

If there's no session, the gate redirects to
`https://tools.usig.ai/login?tool=<product>&next=<this page's URL>` before
your UI ever renders. After sign-in the visitor is sent straight back here.

## 3. Gate every analysis run

Before running an analysis (on your "Analyze" / "Run" / "Submit" button),
call the gate and abort if it returns `false`:

```js
async function onAnalyzeClick() {
  const ok = await window.usigCheckAndRecord();
  if (!ok) return; // limit reached — the gate already showed the upgrade modal

  runYourExistingAnalysis();
}
```

`usigCheckAndRecord()` re-checks the limit against `can_run()` and, if
allowed, calls `record_usage()` — both server-side Postgres functions the
client cannot forge. Treat this as a UX nicety, not the real enforcement:
the RPCs themselves check `auth.uid()` against the account being queried,
so there's nothing to bypass by skipping this call other than a broken UX
(the user would still be capped, just without a friendly modal).

After `init()` runs, `window.USIG` holds `{ user, profile, plan, used, limit }`
if you want to build your own UI instead of the gate's default usage banner.
`plan` is `"paid"` both for a self-serve Stripe subscriber **and** for
someone comped in for free — see §6 below, there's no client-visible
difference and there shouldn't be.

## 4. Financing Analysis only — compliance

Two additional helpers are exposed by the same gate script:

```js
// Before generating any client-facing report:
if (!window.usigRequireNmls()) return; // sends the user to /account/profile if missing

// Append to the bottom of every generated output:
const footer = window.usigFinancingFooter();
```

`usigFinancingFooter()` returns `null` if the signed-in user has no NMLS ID
on file — treat that the same as `usigRequireNmls()` returning `false` and
block generation. Never generate or display a client-facing report without
appending this footer text. Per the product's compliance rules, Financing
Analysis output itself must never name a specific lender or state a rate,
APR, payment amount, or fee figure — that constraint lives in the tool's
own output logic, not in the gate.

## 5. PWA — install to home screen

Each tool site needs its own manifest and icons (they're separate apps with
separate identities); this repo ships starter versions under
`pwa-assets/<tool>/`:

| Tool | Use this folder |
|---|---|
| Residential Analysis | `pwa-assets/residential/` |
| Commercial Analysis | `pwa-assets/commercial/` |
| Financing Analysis | `pwa-assets/financing/` |

For each site:

1. Copy that folder's `manifest.json` to the site's `/manifest.json`, and
   its `icons/` folder to the site's `/icons/`.
2. Copy `pwa-assets/sw.js` to the site's `/sw.js` (identical across all
   three — it does no caching, it only exists to satisfy install
   criteria).
3. Copy `pwa-assets/add-to-home-hint.js` to the site and include it with
   `<script src="/add-to-home-hint.js" defer></script>`.
4. Add to `<head>`:

   ```html
   <link rel="manifest" href="/manifest.json" />
   <meta name="theme-color" content="#0b3d2e" />
   <link rel="apple-touch-icon" href="/icons/icon-192.png" />
   ```

5. Register the service worker:

   ```html
   <script>
     if ("serviceWorker" in navigator) {
       navigator.serviceWorker.register("/sw.js");
     }
   </script>
   ```

**The icons in `pwa-assets/*/icons/` are placeholders** — solid-color
squares with a single letter, generated so the manifest is valid and
installable today. Replace them with real artwork before launch, at these
exact files/sizes:

- `icon-192.png` — 192×192, `purpose: any`
- `icon-512.png` — 512×512, `purpose: any`
- `icon-maskable-192.png` — 192×192, `purpose: maskable` (keep the logo inside the center ~80% safe zone — Android crops maskable icons to a circle/rounded-square)
- `icon-maskable-512.png` — 512×512, `purpose: maskable`, same safe-zone rule

## 6. Financing Analysis — complimentary access for automation-service subscribers

Financing Analysis has two paths to unlimited access: the public $49/mo
(or $490/yr) Stripe subscription anyone can buy from `/tools/financing`,
**and** complimentary access for loan originators who subscribe to your
agent automation service elsewhere. There's no code integration between
that service and this hub yet, so for now, granting comp access is a
manual step in the Supabase SQL editor:

```sql
-- Grant complimentary unlimited Financing Analysis access
update subscriptions
set plan = 'paid', status = 'active', current_period_end = null,
    cancel_at_period_end = false, updated_at = now()
where user_id = (select id from auth.users where email = 'loanofficer@example.com')
  and product = 'financing';
```

That user now has unlimited access exactly like a paying subscriber — same
`can_run()` result, same UI, no "upgrade" prompt. `stripe_subscription_id`
stays `null` on that row, which is how you can tell a comp grant apart from
a real Stripe subscription later (e.g. in a report). If they ever also buy
the plan directly through Stripe, the webhook will just overwrite this row
with the real subscription — no conflict, no special handling needed.

To revoke comp access:

```sql
update subscriptions
set plan = 'free', status = 'active', current_period_end = null
where user_id = (select id from auth.users where email = 'loanofficer@example.com')
  and product = 'financing'
  and stripe_subscription_id is null; -- never touches a real paid subscription
```

Worth automating (a scheduled job or a webhook from the automation service)
once that service exists — see `DECISIONS.md`.

## 7. Supabase dashboard configuration (one-time)

- **Authentication → URL Configuration**: set Site URL to
  `https://tools.usig.ai`, and add `https://tools.usig.ai/auth/callback` to
  Redirect URLs. Magic links and Google OAuth always land back on the hub,
  never on a tool subdomain directly — the hub then forwards the browser to
  the originating tool site via `?next=`.
- **Authentication → Providers → Google**: configure the OAuth client with
  authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`.

## 8. Verifying cross-subdomain auth actually works

This is the most common failure point, so check it explicitly after
deploying:

1. Sign in on `tools.usig.ai`.
2. Open your browser's DevTools → Application/Storage → Cookies for
   `tools.usig.ai`. Confirm the `sb-*-auth-token` cookie(s) show
   **Domain: `.usig.ai`** (leading dot), not `tools.usig.ai`.
3. Navigate directly to `deals-desk.usig.ai` (no login step). `gate.js`
   should find the existing session immediately — no redirect to `/login`.
4. If it still redirects: confirm `gate.js` is loaded as `type="module"`
   (a plain `<script src>` won't execute the `import`), and that the tool
   site is actually on a `*.usig.ai` subdomain — the cookie domain logic in
   `gate.js` only sets `.usig.ai` when `location.hostname` ends in
   `usig.ai`; on a non-`usig.ai` preview/staging domain it falls back to a
   host-only cookie and sessions won't cross subdomains, which is expected
   in that environment.
