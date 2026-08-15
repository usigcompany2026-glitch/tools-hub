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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-deep/97 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href="/" className="text-[15px] font-extrabold tracking-tight text-white">
          USIG <span className="text-gold">Decision Tools</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-white/70 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/account" className="hidden text-white/70 hover:text-white sm:inline">
            Account
          </Link>
          {user ? (
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-md bg-gold px-4 py-2 text-sm font-bold text-navy-deep hover:bg-gold-light"
              >
                Sign out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-gold px-4 py-2 text-sm font-bold text-navy-deep hover:bg-gold-light"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
