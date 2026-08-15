// Vanilla-JS equivalent of the hub's AddToHomeScreenHint component, for the
// three plain HTML/JS tool sites. Include after gate.js; dismissible,
// one-line, mobile-only, shown once.
(function () {
  var DISMISS_KEY = "usig_a2hs_dismissed";

  function isStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  function isMobile() {
    return /iphone|ipad|ipod|android/i.test(window.navigator.userAgent);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (!isMobile() || isStandalone() || localStorage.getItem(DISMISS_KEY) === "1") return;

    var bar = document.createElement("div");
    bar.setAttribute(
      "style",
      "position:fixed;left:0;right:0;bottom:0;z-index:99998;background:#0b3d2e;color:#fff;" +
        "font:12px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;padding:8px 16px;" +
        "display:flex;align-items:center;justify-content:space-between;gap:12px;"
    );
    bar.innerHTML =
      "<span>Add this tool to your home screen for one-tap access — use your browser&#39;s Share/Menu → Add to Home Screen.</span>" +
      '<button id="usig-a2hs-dismiss" style="background:none;border:none;color:#fff;font-size:16px;line-height:1;cursor:pointer;">&times;</button>';

    document.body.appendChild(bar);
    document.getElementById("usig-a2hs-dismiss").onclick = function () {
      localStorage.setItem(DISMISS_KEY, "1");
      bar.remove();
    };
  });
})();
