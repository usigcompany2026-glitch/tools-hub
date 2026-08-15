import Link from "next/link";

export default function AutoRenewalDisclosure({
  showContactLine = true,
}: {
  showContactLine?: boolean;
}) {
  return (
    <div className="space-y-3 text-sm text-ink/70">
      <p>
        <strong className="text-ink">Start free, no credit card.</strong> Every tool includes a
        full 7-day free trial. Upgrade anytime during or after your trial. Paid subscriptions
        renew automatically until you cancel — one click from your account, no phone call, no
        email, no questions.
      </p>
      {showContactLine && (
        <p>
          Working on something these tools don&apos;t cover?{" "}
          <Link href="/contact" className="underline hover:text-ink">
            Reach out
          </Link>{" "}
          — we do custom analysis and advisory.
        </p>
      )}
    </div>
  );
}
