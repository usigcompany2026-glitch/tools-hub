function daysLeft(trialEndsAt: string): number {
  const ms = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function TrialBanner({ trialEndsAt }: { trialEndsAt: string }) {
  const remaining = daysLeft(trialEndsAt);
  const dayLabel = remaining === 1 ? "1 day" : `${remaining} days`;

  return (
    <div className="rounded border border-border bg-white px-4 py-3 text-sm text-ink">
      <strong>Free trial — {dayLabel} left.</strong> No credit card on file.{" "}
      <a href="#pricing" className="underline hover:text-accent">
        Upgrade anytime
      </a>
    </div>
  );
}

export function TrialExpiredBanner() {
  return (
    <div className="rounded border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-ink">
      <strong>Your 7-day free trial has ended.</strong> Upgrade below to keep using this tool —
      no gap in access once you do.
    </div>
  );
}
