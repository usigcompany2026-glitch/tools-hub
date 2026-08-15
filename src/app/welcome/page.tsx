import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS, isProductKey } from "@/lib/products";

export const metadata: Metadata = {
  title: "You're all set",
  description: "Your USIG Decision Tools subscription is active.",
  alternates: { canonical: "/welcome" },
};

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  const cfg = product && isProductKey(product) ? PRODUCTS[product] : null;

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">You&apos;re all set</h1>
      <p className="mt-3 text-ink/70">
        {cfg
          ? `${cfg.name} is now unlimited. Billing runs until you cancel — one click from your account, no phone call, no email.`
          : "Your subscription is active."}
      </p>

      <div className="mt-8 flex flex-col items-center gap-3">
        {cfg && (
          <a
            href={cfg.toolUrl}
            className="rounded bg-accent px-6 py-3 text-sm font-medium text-white hover:bg-accent-light"
          >
            Launch {cfg.name}
          </a>
        )}
        <Link href="/account" className="text-sm text-ink/60 underline hover:text-ink">
          Go to your account
        </Link>
      </div>
    </div>
  );
}
