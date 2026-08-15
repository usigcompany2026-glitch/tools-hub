"use server";

import { createClient } from "@/lib/supabase/server";
import { isRole, roleConfig, type Role } from "@/lib/roles";
import { isProductKey, PRODUCTS, type ProductKey } from "@/lib/products";
import { sendNewTrialSignupNotification } from "@/lib/email";
import { pushNewSubscriberToAirtable } from "@/lib/airtable";

interface SignupMeta {
  full_name?: string | null;
  role?: string | null;
  license_number?: string | null;
  signup_tool?: string | null;
}

/**
 * Populates role/license on the new user's profile row (the trial
 * subscription rows themselves are created automatically by the
 * handle_new_user DB trigger — see supabase/migrations/003_trial_gating.sql)
 * and fires the owner notification + Airtable push. Called once per new
 * signup, either immediately (session created without email confirmation)
 * or from /auth/callback (session created after confirming). No-ops if no
 * role was collected, so it's harmless to call for non-signup sign-ins too.
 */
export async function completeSignup(userId: string, email: string, meta: SignupMeta) {
  if (!meta.role || !isRole(meta.role)) return;

  const role: Role = meta.role;
  const config = roleConfig(role);
  const fullName = meta.full_name || null;
  const licenseNumber = meta.license_number || null;
  const tool: ProductKey | null =
    meta.signup_tool && isProductKey(meta.signup_tool) ? meta.signup_tool : null;

  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      role,
      ...(config.licenseField ? { [config.licenseField]: licenseNumber } : {}),
    })
    .eq("id", userId);

  await sendNewTrialSignupNotification({
    fullName,
    email,
    role: config.label,
    licenseNumber,
    startedFromTool: tool ? PRODUCTS[tool].name : null,
  }).catch(() => {});

  await pushNewSubscriberToAirtable({
    fullName,
    email,
    role,
    licenseNumber,
    startedFromTool: tool,
  }).catch(() => {});
}
