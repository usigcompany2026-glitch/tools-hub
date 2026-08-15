import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for USIG Decision Tools.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-sm leading-relaxed text-ink/80 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">Privacy Policy</h1>
      <p className="mt-2 text-ink/50">Last updated July 26, 2026</p>

      <div className="mt-8 space-y-6">
        <section>
          <h2 className="text-base font-semibold text-ink">1. What we collect</h2>
          <p className="mt-2">
            Account information you provide: email address, and optionally full name, display
            name, company, phone number, NMLS ID, and DRE license number. Usage records: which Tool
            you ran and when, used solely to enforce monthly free-plan limits — we do not log the
            content of your analyses. Billing information: handled entirely by Stripe; we store a
            Stripe customer and subscription reference, never your card number. Documents you
            upload to USIG Commercial Analysis, stored in a private file bucket accessible only to
            your account. Enquiries you submit through the contact form.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">2. How we use it</h2>
          <p className="mt-2">
            To authenticate you across USIG Decision Tools and the three individual Tool sites, to
            enforce free-plan usage limits, to process subscription billing and send billing-related
            email, to personalize Financing Analysis output with your name and NMLS ID at your
            direction, and to respond to enquiries you send us.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">3. Who we share it with</h2>
          <p className="mt-2">
            We share data only with the service providers needed to run USIG Decision Tools:
            Supabase (authentication, database, and file storage), Stripe (billing), and Resend
            (transactional email). We do not sell your data or share it for advertising.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">4. Document security</h2>
          <p className="mt-2">
            Documents uploaded to USIG Commercial Analysis are stored in a private bucket, never
            made public, and accessible only to your account via short-lived signed links. We do
            not include document contents in application logs.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">5. Your choices</h2>
          <p className="mt-2">
            You can review and update your profile details at any time from your account. To
            request deletion of your account and associated data, email brenda@usig.ai. Cancelling
            a subscription does not delete your account or saved work.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">6. Cookies</h2>
          <p className="mt-2">
            We use a single authentication cookie, scoped to usig.ai, to keep you signed in across
            this site and the three Tool sites. We do not use advertising or third-party tracking
            cookies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-ink">7. Contact</h2>
          <p className="mt-2">
            Questions about this policy or your data: brenda@usig.ai. USIG Investment Group ·
            Brenda Le Jones · CA DRE #01365151 · NMLS #2274027.
          </p>
        </section>
      </div>
    </div>
  );
}
