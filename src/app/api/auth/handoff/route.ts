import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProductKey, PRODUCTS } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

/**
 * Carries the signed-in session to a tool subdomain through the link itself.
 *
 * Everything else here depends on the browser sharing a cookie across
 * *.usig.ai, and some browsers will not: iOS keeps a home-screen PWA in a
 * different cookie jar from Safari, and cookie blocking has the same effect.
 * When that happens the hub holds a perfectly good session, the tool site
 * sees nothing, and the user is bounced to a login they already completed.
 * Reading the cookie from a different angle does not help — the cookie is
 * not there to read.
 *
 * So the hub hands the session over directly. The user is authenticated here
 * (server-side, from the hub's own cookie), we mint nothing new, and the
 * existing tokens ride to the tool site in the URL fragment. gate.js adopts
 * them and clears the fragment.
 *
 * The fragment matters: browsers never send it to a server, so the tokens
 * stay out of access logs, referrers, and the CDN. This is the same channel
 * Supabase's own implicit flow uses.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tool = url.searchParams.get("tool");

  if (!tool || !isProductKey(tool)) {
    return NextResponse.redirect(`${SITE_URL}/account`);
  }

  // Destination comes from our own product table, never from the query
  // string, so this cannot be turned into an open redirect.
  const toolUrl = PRODUCTS[tool].toolUrl;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Send them back through this route after login, not straight to the
    // tool. The tool cannot read the hub's session on its own — that is the
    // whole reason this route exists — so returning here is what makes the
    // round trip end with a session instead of another bounce.
    return NextResponse.redirect(
      `${SITE_URL}/login?tool=${tool}&next=${encodeURIComponent(`/api/auth/handoff?tool=${tool}`)}`,
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session?.refresh_token) {
    // Send them back through this route after login, not straight to the
    // tool. The tool cannot read the hub's session on its own — that is the
    // whole reason this route exists — so returning here is what makes the
    // round trip end with a session instead of another bounce.
    return NextResponse.redirect(
      `${SITE_URL}/login?tool=${tool}&next=${encodeURIComponent(`/api/auth/handoff?tool=${tool}`)}`,
    );
  }

  const fragment = new URLSearchParams({
    usig_at: session.access_token,
    usig_rt: session.refresh_token,
  }).toString();

  const response = NextResponse.redirect(`${toolUrl}#${fragment}`);
  // The redirect carries credentials — never let it sit in a shared cache.
  response.headers.set("Cache-Control", "no-store, private");
  return response;
}
