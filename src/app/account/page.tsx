import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LIST } from "@/lib/products";
import { getEntitlements } from "@/lib/entitlements";
import UpgradeButton from "@/components/UpgradeButton";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";

export const metadata: Metadata = {
  title: "Your account",
  description: "Manage your USIG Decision Tools subscriptions, usage, and profile.",
  alternates: { canonical: "/account" },
};

function daysLeft(trialEndsAt: string): number {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account");
  }

  // getEntitlements repairs missing provisioning before reading, so an
  // account that never got its subscription rows heals here instead of
  // showing every tool as locked.
  const entitlements = await getEntitlements(user.id);

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("product, current_period_end")
    .eq("user_id", user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">Your account</h1>
      <p className="mt-1 text-sm text-ink/60">{user.email}</p>
      <p className="mt-4">
        <Link href="/account/profile" className="text-sm underline hover:text-accent">
          Edit profile details
        </Link>
      </p>

      <div className="mt-8 space-y-4">
        {PRODUCT_LIST.map((product) => {
          const entitlement = entitlements[product.key];
          const periodEnd = subs?.find((s) => s.product === product.key)?.current_period_end;
          const plan = entitlement.plan;
          const trialActive = plan === "trial";
          const trialExpired = plan === "trial_expired";
          const trialRemaining = entitlement.trial_ends_at
            ? daysLeft(entitlement.trial_ends_at)
            : null;

          return (
            <div
              key={product.key}
              className="flex flex-col gap-4 rounded border border-border bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{product.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      plan === "paid" ? "bg-accent/10 text-accent" : "bg-ink/5 text-ink/60"
                    }`}
                  >
                    {plan === "paid" ? "Paid" : trialExpired ? "Trial ended" : "Free trial"}
                  </span>
                </div>
                {trialActive && trialRemaining !== null && (
                  <p className="mt-1 text-sm text-ink/60">
                    {trialRemaining === 1 ? "1 day" : `${trialRemaining} days`} left in your free
                    trial
                  </p>
                )}
                {trialExpired && (
                  <p className="mt-1 text-sm text-ink/60">Your free trial has ended</p>
                )}
                {plan === "paid" && periodEnd && (
                  <p className="mt-1 text-sm text-ink/60">
                    Next charge{" "}
                    {new Date(periodEnd).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {/* The account page is where a signed-in user lands, so the
                    entitled tools have to be openable from right here —
                    previously it only offered Upgrade, with no way in. */}
                {entitlement.allowed && (
                  <a
                    href={product.toolUrl}
                    className="rounded-md bg-gold px-4 py-2.5 text-sm font-bold text-navy-deep hover:bg-gold-light"
                  >
                    Open
                  </a>
                )}
                {plan === "paid" ? (
                  <ManageSubscriptionButton />
                ) : (
                  <UpgradeButton product={product.key} label="Upgrade" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 border-t border-border pt-6 text-sm text-ink/70">
        <p className="font-medium text-ink">Need something these tools don&apos;t cover?</p>
        <p className="mt-1">
          Custom analysis, a second opinion on a specific deal, or advisory work —{" "}
          <Link href="/contact" className="underline hover:text-accent">
            get in touch
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
