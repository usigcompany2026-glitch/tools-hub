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
    used: 0,
    limit: 0,
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
  function productUnit(p, count) {
    var singular = count === 1;
    if (p === "residential") return singular ? "analysis" : "analyses";
    if (p === "commercial") return singular ? "underwrite" : "underwrites";
    if (p === "financing") return singular ? "scenario" : "scenarios";
    return singular ? "run" : "runs";
  }
  function productPrice(p) {
    if (p === "residential") return "$29.99";
    if (p === "commercial") return "$99";
    if (p === "financing") return "$49";
    return "";
  }
  function nextResetDate() {
    var now = new Date();
    var first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return first.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function redirectToLogin() {
    var next = encodeURIComponent(location.href);
    location.href = HUB + "/login?tool=" + encodeURIComponent(PRODUCT) + "&next=" + next;
  }

  function showToolUI() {
    var el = document.getElementById("usig-tool");
    if (el) el.style.display = "block";
  }

  function renderUsageBanner(used, limit) {
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
    el.innerHTML =
      "<strong>Free plan — " +
      used +
      " of " +
      limit +
      " used this month.</strong> " +
      '<a href="' +
      HUB +
      "/tools/" +
      productSlug(PRODUCT) +
      '#pricing" style="color:#0b3d2e;text-decoration:underline;">Upgrade for unlimited</a>';
  }

  function showUpgradeModal(product, data) {
    var existing = document.getElementById("usig-upgrade-modal");
    if (existing) existing.remove();

    var overlay = document.createElement("div");
    overlay.id = "usig-upgrade-modal";
    overlay.setAttribute(
      "style",
      "position:fixed;inset:0;background:rgba(18,24,31,0.5);display:flex;" +
        "align-items:center;justify-content:center;z-index:99999;font-family:-apple-system,Segoe UI,Roboto,sans-serif;"
    );

    var card = document.createElement("div");
    card.setAttribute(
      "style",
      "background:#fff;max-width:420px;width:calc(100% - 32px);border-radius:8px;padding:28px;text-align:center;"
    );

    var limit = data.limit || 0;
    card.innerHTML =
      '<h3 style="margin:0 0 12px;font-size:18px;color:#12181f;">You&#39;ve used your ' +
      limit +
      " free " +
      productUnit(product, limit) +
      ' this month</h3><p style="margin:0 0 4px;font-size:14px;color:#3a4149;">Upgrade to ' +
      productDisplayName(product) +
      " for unlimited access — " +
      productPrice(product) +
      '/month, cancel anytime.</p><p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Your free ' +
      productUnit(product, limit) +
      " reset on " +
      nextResetDate() +
      '.</p><a href="' +
      HUB +
      "/tools/" +
      productSlug(product) +
      '#pricing" style="display:inline-block;background:#0b3d2e;color:#fff;padding:10px 20px;' +
      'border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Upgrade now</a>' +
      '<div style="margin-top:14px;"><button id="usig-modal-dismiss" style="background:none;border:none;' +
      'color:#6b7280;font-size:13px;text-decoration:underline;cursor:pointer;">Maybe later</button></div>';

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    document.getElementById("usig-modal-dismiss").onclick = function () {
      overlay.remove();
    };
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    });
  }

  async function init() {
    var {
      data: { session },
    } = await sb.auth.getSession();

    if (!session) {
      redirectToLogin();
      return;
    }
    window.USIG.user = session.user;

    var { data: profile } = await sb
      .from("profiles")
      .select("full_name, display_name, company, nmls_id, dre_license")
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
    window.USIG.used = data.used || 0;
    window.USIG.limit = data.limit || 0;

    if (data.plan === "free") renderUsageBanner(data.used || 0, data.limit || 0);
    showToolUI();
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
