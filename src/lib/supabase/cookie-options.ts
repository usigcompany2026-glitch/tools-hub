/**
 * Auth cookies must be readable on every *.usig.ai subdomain (the three tool
 * sites plus this hub) so a session started on tools.usig.ai carries over to
 * deals-desk.usig.ai / cre-analysis.usig.ai / mortgage.usig.ai and back.
 * Locally (no usig.ai host) we omit the domain so cookies still work on localhost.
 */
export function getCookieDomain(): string | undefined {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  try {
    const host = new URL(siteUrl).hostname;
    if (host.endsWith("usig.ai")) return ".usig.ai";
  } catch {
    // fall through
  }
  return undefined;
}

export const AUTH_COOKIE_OPTIONS = {
  domain: getCookieDomain(),
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};
