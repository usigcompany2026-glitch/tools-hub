import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/tools/residential", label: "Residential Analysis" },
  { href: "/tools/commercial", label: "Commercial Analysis" },
  { href: "/tools/financing", label: "Financing Analysis" },
];

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export default async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-border bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="text-sm font-semibold tracking-tight text-ink">
          USIG Decision Tools
        </Link>
        <nav className="hidden gap-6 text-sm text-ink/70 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/account" className="text-ink/70 hover:text-ink">
            Account
          </Link>
          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded bg-accent px-4 py-2 font-medium text-white hover:bg-accent-light"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded bg-accent px-4 py-2 font-medium text-white hover:bg-accent-light"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
