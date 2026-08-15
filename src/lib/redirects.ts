const ALLOWED_HOST_SUFFIX = "usig.ai";

/**
 * `next` arrives as a query param from gate.js on a different origin
 * (e.g. deals-desk.usig.ai). Only allow relative paths or absolute URLs
 * on a usig.ai host, so a crafted ?next= can't be used as an open redirect.
 */
export function safeNextUrl(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;

  if (next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }

  try {
    const url = new URL(next);
    const host = url.hostname;
    if (host === ALLOWED_HOST_SUFFIX || host.endsWith(`.${ALLOWED_HOST_SUFFIX}`)) {
      return next;
    }
  } catch {
    // not a valid absolute URL
  }

  return fallback;
}
