import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PRODUCT_LIST } from "@/lib/products";

/**
 * Session handoff for the tool subdomains.
 *
 * The three tool sites share a session with the hub through a cookie scoped to
 * ".usig.ai". That works in most browsers and silently does not in others —
 * iOS Safari in particular was observed holding a session for tools.usig.ai
 * while deals-desk.usig.ai saw nothing, which left gate.js bouncing the user
 * back to a login they had already completed.
 *
 * This endpoint gives gate.js a way to recover instead of looping: it returns
 * the caller's own session tokens, but only to a request that already carries
 * a valid hub session cookie, and only to one of our own tool origins. It
 * grants nothing the caller did not already have — the browser making this
 * request is holding the session cookie that proves it.
 */

const ALLOWED_ORIGINS = new Set(PRODUCT_LIST.map((p) => new URL(p.toolUrl).origin));

function corsHeaders(origin: string | null): Record<string, string> {
  // Vary matters: without it a cache could serve one tool site's CORS headers
  // to another.
  const headers: Record<string, string> = {
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  return headers;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin");
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...corsHeaders(origin),
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}

export async function GET(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);

  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: "origin_not_allowed" }, { status: 403, headers });
  }

  const supabase = await createClient();

  // getUser revalidates against the auth server; getSession alone would trust
  // whatever the cookie claims. Only after the user checks out do we read the
  // tokens back out of the session.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "no_session" }, { status: 401, headers });
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session?.refresh_token) {
    return NextResponse.json({ error: "no_session" }, { status: 401, headers });
  }

  return NextResponse.json(
    { access_token: session.access_token, refresh_token: session.refresh_token },
    { headers },
  );
}
