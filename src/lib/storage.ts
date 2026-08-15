import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export const COMMERCIAL_DOCS_BUCKET = "commercial-documents";
const SIGNED_URL_TTL_SECONDS = 120;

/**
 * Path convention enforced by the storage RLS policies in
 * 002_storage.sql: the first path segment must equal the uploader's uid.
 */
export function commercialDocPath(userId: string, filename: string): string {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${userId}/${Date.now()}-${safeName}`;
}

/** Short-expiry signed URL — never expose a public URL for borrower documents. */
export async function getSignedDocUrl(supabase: SupabaseClient, path: string) {
  const { data, error } = await supabase.storage
    .from(COMMERCIAL_DOCS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}
