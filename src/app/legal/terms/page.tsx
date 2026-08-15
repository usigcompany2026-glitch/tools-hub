import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for USIG Decision Tools.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-sm leading-relaxed text-ink/80 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">Terms of Service</h1>
      <p className="mt-2 text-ink/50">Last updated July 26, 2026</p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-base font-semibold text-ink">1. The service</h2>
          <p className="mt-2">
            USIG Decision Tools (&quot;we,&quot; &quot;us&quot;) operates tools.usig.ai and
            provides accounts, billing, and usage metering for three analysis tools: USIG
            Residential Analysis, USIG Commercial Analysis, and USIG Financing Analysis (each a &quot;Tool,&quot;
            together the &quot;Tools&quot;). Each Tool runs on its own subdomain; this site
            authenticates you and manages your subscription and monthly usage.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">2. Accounts and free plans</h2>
          <p className="mt-2">
            Each Tool has a free tier with a fixed number of runs per calendar month, described on
            that Tool&apos;s page. Free plans never expire and do not require a payment method. We
            enforce monthly limits server-side; your account resets automatically at the start of
            each calendar month.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">
            3. Paid subscriptions and automatic renewal
          </h2>
          <p className="mt-2">
            Paid plans unlock unlimited use of a single Tool and are billed in advance, monthly or
            annually as selected at checkout. There is no free trial — your card is charged
            immediately when you subscribe.
          </p>
          <p className="mt-2">
            <strong className="text-ink">Your subscription renews automatically</strong> at the end
            of each billing period, at the then-current price, until you cancel. You may cancel at
            any time from your account — one click, no phone call, no email, and no retention offer
            or survey stands between you and cancellation. Cancelling stops future renewals;
            unlimited access continues through the end of the period you already paid for, and your
            account then returns to that Tool&apos;s free plan. Your saved work is not deleted when
            you cancel.
          </p>
          <p className="mt-2">
            Each Tool is billed and cancelled independently. Subscribing to a second Tool from the
            same account does not affect your existing subscriptions.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">4. Acceptable use</h2>
          <p className="mt-2">
            You are responsible for the accuracy of information you enter into a Tool and for how
            you use its output. The Tools provide analytical and informational output only — see
            each Tool&apos;s page for what it does and does not represent. You may not attempt to
            circumvent usage limits, resell access, or use the Tools to build a competing product.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">5. Financing Analysis disclosures</h2>
          <p className="mt-2">
            USIG Financing Analysis output describes general loan structures and program types only.
            It does not name lenders, quote rates, or state payment amounts, and it is not a loan
            application, pre-qualification, commitment, or approval, and not an offer of credit.
            Program parameters are general guidance; all terms and eligibility are subject to
            individual lender underwriting.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">6. Disclaimers</h2>
          <p className="mt-2">
            The Tools are provided &quot;as is&quot; for informational purposes and do not
            constitute financial, legal, tax, or lending advice. To the extent permitted by law, we
            disclaim warranties of any kind and are not liable for decisions made based on Tool
            output.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">7. Changes</h2>
          <p className="mt-2">
            We may update these Terms from time to time. Material changes will be reflected by the
            &quot;Last updated&quot; date above.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">8. Contact</h2>
          <p className="mt-2">
            Questions about these Terms: brenda@usig.ai. USIG Investment Group · Brenda Le Jones ·
            CA DRE #01365151 · NMLS #2274027.
          </p>
        </section>
      </div>
    </div>
  );
}
