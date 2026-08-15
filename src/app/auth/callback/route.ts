import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNextUrl } from "@/lib/redirects";
import { isProductKey, PRODUCTS } from "@/lib/products";
import { sendWelcomeEmail } from "@/lib/email";
import { completeSignup } from "@/app/signup/actions";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;
const NEW_USER_WINDOW_MS = 60_000;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tool = url.searchParams.get("tool");
  const next = url.searchParams.get("next");

  const fallback =
    tool && isProductKey(tool) ? `${SITE_URL}/tools/${PRODUCTS[tool].slug}` : `${SITE_URL}/account`;
  const redirectTo = safeNextUrl(next, fallback);

  if (!code) {
    return NextResponse.redirect(`${SITE_URL}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${SITE_URL}/login?error=auth_failed`);
  }

  const createdAt = new Date(data.user.created_at).getTime();
  const isNewUser = Date.now() - createdAt < NEW_USER_WINDOW_MS;

  if (isNewUser && data.user.email) {
    // Signups from /signup carry role/full_name/license in user_metadata
    // (set via signUp's options.data) — completeSignup no-ops if there's no
    // role, so this is harmless for Google/other sign-ins too.
    const meta = data.user.user_metadata as {
      full_name?: string;
      role?: string;
      license_number?: string;
      signup_tool?: string;
    };
    await completeSignup(data.user.id, data.user.email, {
      full_name: meta.full_name ?? null,
      role: meta.role ?? null,
      license_number: meta.license_number ?? null,
      signup_tool: meta.signup_tool ?? null,
    });

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", data.user.id)
      .maybeSingle();
    await sendWelcomeEmail(data.user.email, profile?.full_name ?? null).catch(() => {
      // Welcome email is best-effort — never block sign-in on it.
    });
  }

  return NextResponse.redirect(redirectTo);
}
