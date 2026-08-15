import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LIST, type ProductKey } from "@/lib/products";

export interface Entitlement {
  allowed: boolean;
  plan: "paid" | "trial" | "trial_expired" | "no_account";
  trial_ends_at?: string | null;
  reason?: string;
}

export type EntitlementMap = Record<ProductKey, Entitlement>;

const LOCKED: Entitlement = { allowed: false, plan: "no_account", reason: "no_account" };

/**
 * The single place the Hub answers "what can this signed-in user open?".
 *
 * Every entitlement read goes through here so that ensure_provisioned() runs
 * first. That RPC is the repair path for accounts that reached auth.users
 * without the handle_new_user trigger having created their profile and
 * subscription rows — without it those accounts sign in fine and then find
 * every tool locked, because can_run() has no row to read. It is idempotent
 * and never modifies existing rows, so calling it on each load is safe.
 *
 * Returns an entry for all three products always, so callers can render the
 * full set rather than only the products that happen to have rows.
 */
export async function getEntitlements(userId: string): Promise<EntitlementMap> {
  const supabase = await createClient();

  // Repair before reading. If it fails we still fall through to can_run —
  // a healthy account doesn't need it, and a stranded one is no worse off.
  await supabase.rpc("ensure_provisioned");

  const results = await Promise.all(
    PRODUCT_LIST.map(async (product) => {
      const { data } = await supabase.rpc("can_run", {
        p_user: userId,
        p_product: product.key,
      });
      return [product.key, (data as Entitlement | null) ?? LOCKED] as const;
    }),
  );

  return Object.fromEntries(results) as EntitlementMap;
}
