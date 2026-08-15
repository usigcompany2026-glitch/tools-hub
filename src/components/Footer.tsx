import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-paper">
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-ink/60 sm:px-6">
        <p className="font-medium text-ink/80">Powered by the USIG Decision Method</p>
        <p className="mt-1">
          Brenda Le Jones · CA DRE #01365151 · NMLS #2274027 · USIG Investment Group
        </p>
        <p className="mt-3">
          <Link href="/legal/terms" className="underline hover:text-ink">
            Terms
          </Link>{" "}
          ·{" "}
          <Link href="/legal/privacy" className="underline hover:text-ink">
            Privacy
          </Link>
        </p>
      </div>
    </footer>
  );
}
