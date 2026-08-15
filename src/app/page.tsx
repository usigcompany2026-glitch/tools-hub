import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCT_LIST } from "@/lib/products";
import PricingCard from "@/components/PricingCard";
import AutoRenewalDisclosure from "@/components/AutoRenewalDisclosure";

export const metadata: Metadata = {
  title: "USIG Decision Tools — Residential Analysis, Commercial Underwriting & Financing Analysis",
  description:
    "Three tools. Pick the one you need. Each works on its own. Start free — no credit card.",
  alternates: { canonical: "/" },
};

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          USIG Decision Tools
        </h1>
        <h2 className="mt-3 text-xl text-ink/70">Three tools. Pick the one you need.</h2>
        <p className="mt-4 text-base text-ink/70">
          Each works on its own. Start free — no credit card.
        </p>
      </div>

      <div id="pricing" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PRODUCT_LIST.map((product) => (
          <PricingCard
            key={product.key}
            product={product}
            cta={
              <Link
                href={`/login?tool=${product.key}`}
                className="block w-full rounded bg-accent px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-accent-light"
              >
                Start Free
              </Link>
            }
          />
        ))}
      </div>

      <div className="mt-12 max-w-2xl">
        <AutoRenewalDisclosure />
      </div>
    </div>
  );
}
