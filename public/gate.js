// USIG Decision Tools — gate script
// Loaded on the three standalone tool sites: deals-desk.usig.ai
// (Residential Analysis), cre-analysis.usig.ai (Commercial Analysis), and
// mortgage.usig.ai (Financing Analysis — domain kept as-is; only the
// display name changed). Loaded as an ES module:
//   <script type="module" src="https://tools.usig.ai/gate.js"></script>
// See INSTALL.md for the full integration contract.
//
// Uses @supabase/ssr's createBrowserClient (not the plain supabase-js
// client) so the auth cookie is written in exactly the same format the
// hub's Next.js app reads/writes, with domain=".usig.ai" — that's what
// lets a session started on tools.usig.ai carry over here.
import { createBrowserClient } from "https://cdn.jsdelivr.net/npm/@supabase/ssr@0.5.2/+esm";

(function () {
  var PRODUCT = window.USIG_PRODUCT;
  var HUB = window.USIG_HUB_URL || "https://tools.usig.ai";
  var SUPABASE_URL = window.USIG_SUPABASE_URL;
  var SUPABASE_ANON_KEY = window.USIG_SUPABASE_ANON_KEY;

  if (!PRODUCT || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error(
      "[USIG gate] Set window.USIG_PRODUCT, window.USIG_SUPABASE_URL and window.USIG_SUPABASE_ANON_KEY before loading gate.js"
    );
    return;
  }

  var cookieDomain = /(^|\.)usig\.ai$/.test(location.hostname) ? ".usig.ai" : undefined;

  var sb = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookieOptions: {
      domain: cookieDomain,
      path: "/",
      sameSite: "lax",
      secure: location.protocol === "https:",
    },
  });

  window.USIG = {
    user: null,
    profile: null,
    plan: null,
    trialEndsAt: null,
    product: PRODUCT,
    hub: HUB,
  };

  function productSlug(p) {
    return p;
  }
  function productDisplayName(p) {
    if (p === "residential") return "USIG Residential Analysis";
    if (p === "commercial") return "USIG Commercial Analysis";
    if (p === "financing") return "USIG Financing Analysis";
    return p;
  }
  function productPrice(p) {
    if (p === "residential") return "$29.99";
    if (p === "commercial") return "$99";
    if (p === "financing") return "$49";
    return "";
  }
  function daysLeft(trialEndsAt) {
    if (!trialEndsAt) return 0;
    var ms = new Date(trialEndsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
  }

  function redirectToLogin() {
    var next = encodeURIComponent(location.href);
    location.href = HUB + "/login?tool=" + encodeURIComponent(PRODUCT) + "&next=" + next;
  }

  // Sending the user back to a login they already completed is the one
  // outcome worth avoiding here. If we bounce once and land back with still
  // no session, the cookie is not reaching this subdomain and looping will
  // not fix it — say so instead of ping-ponging.
  var RETRY_FLAG = "usig_gate_retried";

  function bounceOnce() {
    try {
      if (sessionStorage.getItem(RETRY_FLAG)) {
        sessionStorage.removeItem(RETRY_FLAG);
        showSessionStuckMessage();
        return;
      }
      sessionStorage.setItem(RETRY_FLAG, "1");
    } catch (e) {
      // Safari private mode can throw on sessionStorage; a redirect is still
      // the best available move.
    }
    redirectToLogin();
  }

  function showSessionStuckMessage() {
    document.body.style.visibility = "visible";
    var box = document.createElement("div");
    box.setAttribute(
      "style",
      "font:15px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;max-width:460px;margin:64px auto;" +
        "background:#fff;border:1px solid #e2e0da;border-radius:8px;padding:24px;color:#12181f;"
    );
    box.innerHTML =
      '<h3 style="margin:0 0 10px;font-size:17px;">We could not carry your sign-in over</h3>' +
      '<p style="margin:0 0 16px;color:#3a4149;">You are signed in, but this browser is not sharing ' +
      "that session with this page. This is usually a blocked-cookie setting.</p>" +
      '<p style="margin:0 0 16px;color:#3a4149;">On iPhone: Settings → Apps → Safari → turn off ' +
      "<strong>Block All Cookies</strong>, then reload.</p>" +
      '<a href="' +
      HUB +
      '/account" style="display:inline-block;background:#0b3d2e;color:#fff;padding:10px 18px;' +
      'border-radius:6px;text-decoration:none;font-weight:600;">Back to your account</a>';
    document.body.appendChild(box);
  }

  // The cookie is the fast path. When it is missing — some browsers refuse to
  // share it across *.usig.ai even though the hub holds a valid session — ask
  // the hub directly rather than assuming the user is signed out. The request
  // carries the hub's own cookie, so it only ever returns a session the
  // browser already had.
  async function trySessionHandoff() {
    try {
      var res = await fetch(HUB + "/api/auth/session", {
        credentials: "include",
        headers: { accept: "application/json" },
      });
      if (!res.ok) return false;
      var body = await res.json();
      if (!body || !body.access_token || !body.refresh_token) return false;
      var { error } = await sb.auth.setSession({
        access_token: body.access_token,
        refresh_token: body.refresh_token,
      });
      return !error;
    } catch (e) {
      return false;
    }
  }

  function showToolUI() {
    // Two supported integration patterns:
    // 1. Host page wraps its content in <div id="usig-tool"> (hidden by default) —
    //    used when the host wants fine-grained control over what's gated.
    // 2. Host page just hides <body> via a `<style>body{visibility:hidden}</style>`
    //    tag in <head> (no DOM restructuring needed) — simplest for existing
    //    single-file tools. gate.js clears it here once access is confirmed.
    var el = document.getElementById("usig-tool");
    if (el) el.style.display = "block";
    document.body.style.visibility = "visible";
  }

  function renderTrialBanner(trialEndsAt) {
    var el = document.getElementById("usig-usage-banner");
    if (!el) {
      el = document.createElement("div");
      el.id = "usig-usage-banner";
      el.setAttribute(
        "style",
        "font:14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;background:#fff;" +
          "border:1px solid #e2e0da;border-radius:6px;padding:10px 14px;margin-bottom:16px;color:#12181f;"
      );
      var toolEl = document.getElementById("usig-tool");
      var parent = toolEl ? toolEl.parentNode : document.body;
      parent.insertBefore(el, toolEl || parent.firstChild);
    }
    var remaining = daysLeft(trialEndsAt);
    var dayLabel = remaining === 1 ? "1 day" : remaining + " days";
    el.innerHTML =
      "<strong>Free trial — " +
      dayLabel +
      " left.</strong> No credit card on file. " +
      '<a href="' +
      HUB +
      "/tools/" +
      productSlug(PRODUCT) +
      '#pricing" style="color:#0b3d2e;text-decoration:underline;">Upgrade anytime</a>';
  }

  // dismissible=false is used at init time for a fully-expired trial, where
  // there's no tool UI underneath worth returning to (body may still be
  // hidden via the visibility:hidden pattern) — so no "maybe later" escape.
  function showUpgradeModal(product, data, dismissible) {
    if (dismissible === undefined) dismissible = true;
    var existing = document.getElementById("usig-upgrade-modal");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.id = "usig-upgrade-modal";
    overlay.setAttribute(
      "style",
      "visibility:visible;position:fixed;inset:0;background:rgba(18,24,31,0.5);display:flex;" +
        "align-items:center;justify-content:center;z-index:99999;font-family:-apple-system,Segoe UI,Roboto,sans-serif;"
    );

    var card = document.createElement("div");
    card.setAttribute(
      "style",
      "visibility:visible;background:#fff;max-width:420px;width:calc(100% - 32px);border-radius:8px;padding:28px;text-align:center;"
    );

    card.innerHTML =
      '<h3 style="margin:0 0 12px;font-size:18px;color:#12181f;">Your 7-day free trial has ended</h3>' +
      '<p style="margin:0 0 20px;font-size:14px;color:#3a4149;">Upgrade to ' +
      productDisplayName(product) +
      " for unlimited access — " +
      productPrice(product) +
      '/month, cancel anytime.</p><a href="' +
      HUB +
      "/tools/" +
      productSlug(product) +
      '#pricing" style="display:inline-block;background:#0b3d2e;color:#fff;padding:10px 20px;' +
      'border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Upgrade now</a>' +
      (dismissible
        ? '<div style="margin-top:14px;"><button id="usig-modal-dismiss" style="background:none;border:none;' +
          'color:#6b7280;font-size:13px;text-decoration:underline;cursor:pointer;">Maybe later</button></div>'
        : "");

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    if (dismissible) {
      document.getElementById("usig-modal-dismiss").onclick = function () {
        overlay.remove();
      };
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) overlay.remove();
      });
    }
  }

  // The hub can hand the session over in the URL fragment (see
  // /api/auth/handoff). This is the only path that works when the browser
  // keeps the hub's cookies in a separate jar from this site — an iOS
  // home-screen PWA, or cookie blocking — because it never needs to read a
  // cookie this origin was never given.
  async function adoptHandoffFromUrl() {
    if (!location.hash || location.hash.indexOf("usig_at=") === -1) return false;
    var params = new URLSearchParams(location.hash.replace(/^#/, ""));
    var at = params.get("usig_at");
    var rt = params.get("usig_rt");
    if (!at || !rt) return false;

    var ok = false;
    try {
      var { error } = await sb.auth.setSession({ access_token: at, refresh_token: rt });
      ok = !error;
    } catch (e) {
      ok = false;
    }

    // Clear the tokens out of the address bar either way, so a reload or a
    // shared link never replays them. replaceState keeps this out of history.
    params.delete("usig_at");
    params.delete("usig_rt");
    var rest = params.toString();
    try {
      history.replaceState(null, "", location.pathname + location.search + (rest ? "#" + rest : ""));
    } catch (e) {
      /* non-fatal */
    }
    return ok;
  }

  async function init() {
    await adoptHandoffFromUrl();

    var {
      data: { session },
    } = await sb.auth.getSession();

    if (!session) {
      var recovered = await trySessionHandoff();
      if (!recovered) {
        bounceOnce();
        return;
      }
      ({
        data: { session },
      } = await sb.auth.getSession());
      if (!session) {
        bounceOnce();
        return;
      }
    }

    // Got here with a session, so any earlier bounce is resolved.
    try {
      sessionStorage.removeItem(RETRY_FLAG);
    } catch (e) {
      /* non-fatal */
    }
    window.USIG.user = session.user;

    var { data: profile } = await sb
      .from("profiles")
      .select("full_name, display_name, company, phone, nmls_id, dre_license, sphere_url, lead_notify_email")
      .eq("id", session.user.id)
      .maybeSingle();
    window.USIG.profile = profile || null;

    var { data, error } = await sb.rpc("can_run", {
      p_user: session.user.id,
      p_product: PRODUCT,
    });

    if (error || !data) {
      console.error("[USIG gate] can_run failed", error);
      return;
    }

    window.USIG.plan = data.plan;
    window.USIG.trialEndsAt = data.trial_ends_at || null;
    // Authenticated client, same session gate.js established — lets host
    // pages make their own queries (e.g. saving deal records) without
    // re-authenticating. Table access is enforced by RLS server-side.
    window.USIG.supabase = sb;

    if (!data.allowed) {
      // Trial expired (or no account row) and there's no per-action hook to
      // catch this later in these reactive, no-single-button tools — so the
      // block has to happen here, at init, before the tool is ever revealed.
      showUpgradeModal(PRODUCT, data, false);
      return;
    }

    if (data.plan === "trial") renderTrialBanner(data.trial_ends_at);
    showToolUI();
    // Lets host pages read window.USIG.user/profile/plan once they're
    // actually populated, instead of guessing when init()'s async work is done.
    window.dispatchEvent(new CustomEvent("usig:ready"));
  }

  // Host page MUST call this before running an analysis, and abort if it
  // returns false. This is a UX convenience only — the real limit is
  // enforced by the can_run()/record_usage() RPCs themselves, which check
  // auth.uid() server-side and cannot be bypassed from the client.
  window.usigCheckAndRecord = async function () {
    var uid = window.USIG.user && window.USIG.user.id;
    if (!uid) {
      redirectToLogin();
      return false;
    }

    var { data, error } = await sb.rpc("can_run", { p_user: uid, p_product: PRODUCT });
    if (error || !data) return false;

    if (!data.allowed) {
      showUpgradeModal(PRODUCT, data);
      return false;
    }

    await sb.rpc("record_usage", { p_user: uid, p_product: PRODUCT });
    return true;
  };

  // Financing Analysis compliance helpers (see INSTALL.md §"Financing Analysis only").
  window.usigRequireNmls = function () {
    var profile = window.USIG.profile;
    if (profile && profile.nmls_id) return true;
    location.href = HUB + "/account/profile?next=" + encodeURIComponent(location.href);
    return false;
  };

  window.usigFinancingFooter = function () {
    var profile = window.USIG.profile;
    if (!profile || !profile.nmls_id) return null;
    var name = profile.display_name || profile.full_name || "";
    return (
      "Prepared by " +
      name +
      " · NMLS #" +
      profile.nmls_id +
      "\nPowered by USIG Decision Intelligence\n" +
      "Informational only. Not a loan application, pre-qualification, commitment, or approval, " +
      "and not an offer of credit. Program parameters are general guidance; all terms and " +
      "eligibility subject to individual lender underwriting."
    );
  };

  window.usigSignOut = function () {
    return sb.auth.signOut().then(redirectToLogin);
  };

  init();
})();
