import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { AUTH_COOKIE_OPTIONS } from "./cookie-options";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Server Component / Route Handler client — respects RLS as the signed-in user. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...AUTH_COOKIE_OPTIONS, ...options })
            );
          } catch {
            // Called from a Server Component with no response to write to —
            // middleware.ts refreshes the session cookie instead.
          }
        },
      },
    }
  );
}
