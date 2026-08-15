import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS — only ever import this from server-only
 * code (route handlers, the Stripe webhook). The `server-only` import makes
 * bundling this into a client component a build-time error, which is the
 * backstop for keeping SUPABASE_SERVICE_ROLE_KEY out of the browser bundle.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    }
  );
}
