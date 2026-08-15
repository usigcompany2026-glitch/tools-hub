import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-navy-deep">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-white/50 sm:px-6">
        <p className="font-medium text-white/70">Powered by the USIG Decision Method</p>
        <p className="mt-1">
          Brenda Le Jones · CA DRE #01365151 · NMLS #2274027 · USIG Investment Group
        </p>
        <p className="mt-3">
          <Link href="/legal/terms" className="underline hover:text-white">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/legal/privacy" className="underline hover:text-white">
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  );
}
