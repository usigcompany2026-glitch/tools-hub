"use client";

import { useEffect, useState } from "react";

const DISMISS_KEY = "usig_a2hs_dismissed";

export default function AddToHomeScreenHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    const isMobile = /iphone|ipad|ipod|android/i.test(window.navigator.userAgent);
    const dismissed = window.localStorage.getItem(DISMISS_KEY) === "1";

    if (isMobile && !isStandalone && !dismissed) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-accent px-4 py-2 text-xs text-white">
      <span>Add this tool to your home screen for one-tap access — use your browser&apos;s Share/Menu → Add to Home Screen.</span>
      <button onClick={dismiss} aria-label="Dismiss" className="shrink-0 text-base leading-none opacity-80 hover:opacity-100">
        &times;
      </button>
    </div>
  );
}
