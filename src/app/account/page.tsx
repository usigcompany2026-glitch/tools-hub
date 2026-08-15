import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LIST, type ProductKey } from "@/lib/products";
import UpgradeButton from "@/components/UpgradeButton";
import ManageSubscriptionButton from "@/components/ManageSubscriptionButton";

export const metadata: Metadata = {
  title: "Your account",
  description: "Manage your USIG Decision Tools subscriptions, usage, and profile.",
  alternates: { canonical: "/account" },
};

interface SubRow {
  product: ProductKey;
  plan: "free" | "paid";
  status: string;
  current_period_end: string | null;
  trial_ends_at: string | null;
}

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

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("product, plan, status, current_period_end, trial_ends_at")
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
          const sub = subs?.find((s) => s.product === product.key) as SubRow | undefined;
          const plan = sub?.plan ?? "free";
          const trialRemaining = sub?.trial_ends_at ? daysLeft(sub.trial_ends_at) : null;
          const trialActive = plan === "free" && trialRemaining !== null && trialRemaining > 0;
          const trialExpired = plan === "free" && trialRemaining !== null && trialRemaining === 0;

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
                {trialActive && (
                  <p className="mt-1 text-sm text-ink/60">
                    {trialRemaining === 1 ? "1 day" : `${trialRemaining} days`} left in your free
                    trial
                  </p>
                )}
                {trialExpired && (
                  <p className="mt-1 text-sm text-ink/60">Your free trial has ended</p>
                )}
                {plan === "paid" && sub?.current_period_end && (
                  <p className="mt-1 text-sm text-ink/60">
                    Next charge{" "}
                    {new Date(sub.current_period_end).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="shrink-0">
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
