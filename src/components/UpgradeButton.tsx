"use client";

import { useState } from "react";
import type { ProductKey, Interval } from "@/lib/products";
import { displayPrice } from "@/lib/products";

export default function UpgradeButton({
  product,
  className,
  label = "Upgrade now",
}: {
  product: ProductKey;
  className?: string;
  label?: string;
}) {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpgrade() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, interval }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Something went wrong starting checkout.");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-3 flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => setInterval("monthly")}
          className={`rounded-full border px-3 py-1 ${
            interval === "monthly" ? "border-navy bg-navy text-white" : "border-border text-ink/60"
          }`}
        >
          Monthly · {displayPrice(product, "monthly")}
        </button>
        <button
          type="button"
          onClick={() => setInterval("annual")}
          className={`rounded-full border px-3 py-1 ${
            interval === "annual" ? "border-navy bg-navy text-white" : "border-border text-ink/60"
          }`}
        >
          Annual · {displayPrice(product, "annual")}
        </button>
      </div>
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        className={
          className ||
          "w-full rounded-md bg-gold px-4 py-2.5 text-sm font-bold text-navy-deep hover:bg-gold-light disabled:opacity-60"
        }
      >
        {loading ? "Redirecting…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
