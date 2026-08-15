export default function UsageBanner({ used, limit }: { used: number; limit: number }) {
  return (
    <div className="rounded border border-border bg-white px-4 py-3 text-sm text-ink">
      <strong>
        Free plan — {used} of {limit} used this month.
      </strong>{" "}
      <a href="#pricing" className="underline hover:text-accent">
        Upgrade for unlimited
      </a>
    </div>
  );
}
