import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PRODUCTS, type ProductKey } from "@/lib/products";
import { getEntitlements, type Entitlement } from "@/lib/entitlements";
import PricingCard from "@/components/PricingCard";
import AutoRenewalDisclosure from "@/components/AutoRenewalDisclosure";
import TrialBanner, { TrialExpiredBanner } from "@/components/TrialBanner";
import UpgradeButton from "@/components/UpgradeButton";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";

export default async function ToolPageContent({ productKey }: { productKey: ProductKey }) {
  const product = PRODUCTS[productKey];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let usage: Entitlement | null = null;

  if (user) {
    usage = (await getEntitlements(user.id))[productKey];
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {product.name}
        </h1>
        <p className="mt-4 text-base text-ink/70">{product.features[0]}</p>
      </div>

      {user && usage && (
        <div className="mt-8 max-w-2xl space-y-4">
          {usage.plan === "trial" && usage.trial_ends_at && (
            <TrialBanner trialEndsAt={usage.trial_ends_at} />
          )}
          {usage.plan === "trial_expired" && <TrialExpiredBanner />}
          <div className="flex flex-wrap gap-3">
            {usage.allowed && (
              <a
                href={product.toolUrl}
                className="rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-navy-deep hover:bg-gold-light"
              >
                Launch {product.name}
              </a>
            )}
            {usage.plan === "paid" && <ManageSubscriptionButton />}
          </div>
        </div>
      )}

      <div id="pricing" className="mt-12 max-w-sm">
        <PricingCard
          product={product}
          cta={
            !user ? (
              <Link
                href={`/login?tool=${product.key}`}
                className="block w-full rounded-md bg-gold px-4 py-2.5 text-center text-sm font-bold text-navy-deep hover:bg-gold-light"
              >
                Start Free Trial
              </Link>
            ) : usage?.plan === "paid" ? (
              <p className="text-center text-sm text-ink/60">You&apos;re on the unlimited plan.</p>
            ) : (
              <UpgradeButton product={product.key} />
            )
          }
        />
      </div>

      <div className="mt-12 max-w-2xl">
        <AutoRenewalDisclosure />
      </div>
    </div>
  );
}
