/**
 * Auth cookies must be readable on every *.usig.ai subdomain (the three tool
 * sites plus this hub) so a session started on tools.usig.ai carries over to
 * deals-desk.usig.ai / cre-analysis.usig.ai / mortgage.usig.ai and back.
 * Locally (NODE_ENV !== "production") we omit the domain so cookies still
 * work on localhost. In production this is a fixed literal rather than
 * derived from NEXT_PUBLIC_SITE_URL, so it can't be affected by that var
 * being blank, malformed, or pointed at a preview/netlify.app URL.
 */
export function getCookieDomain(): string | undefined {
  return process.env.NODE_ENV === "production" ? ".usig.ai" : undefined;
}

export const AUTH_COOKIE_OPTIONS = {
  domain: getCookieDomain(),
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
