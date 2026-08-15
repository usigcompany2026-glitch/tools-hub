import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PRODUCT_LIST } from "@/lib/products";
import PricingCard from "@/components/PricingCard";

export const metadata: Metadata = {
  title: "USIG Decision Tools — Residential Analysis, Commercial Underwriting & Financing Analysis",
  description:
    "Three tools. Pick the one you need. Each works on its own. Free for 7 days — no credit card.",
  alternates: { canonical: "/" },
};

const TOOL_SECTIONS = [
  {
    key: "residential" as const,
    tag: "Residential Analysis",
    heading: "Run the numbers on any residential deal in minutes.",
    body: "Cash flow, cap rate, cash-on-cash return, DSCR, and a clear recommendation — the same scorecard your buyer or investor will see.",
    cta: "Analyze a Property",
    image: "/images/residential.jpg",
    reverse: false,
  },
  {
    key: "commercial" as const,
    tag: "Commercial Analysis",
    heading: "Underwrite commercial deals like an institutional buyer.",
    body: "NOI, cap rate, DSCR, debt yield, LTV, and key strengths and risks — organized the way a lender will actually read the deal.",
    cta: "Underwrite a Deal",
    image: "/images/commercial.jpg",
    reverse: true,
  },
  {
    key: "financing" as const,
    tag: "Financing Analysis",
    heading: "Compare financing structures before you present them.",
    body: "See how a loan scenario stacks up — structure, required documents, and next steps — before you're on the phone with a lender.",
    cta: "Analyze Financing Options",
    image: "/images/financing.jpg",
    reverse: false,
  },
];

const WHY_CARDS = [
  {
    icon: "🔍",
    title: "See it before you commit",
    body: "Every tool above shows a real sample of its output — no surprises after you sign up.",
  },
  {
    icon: "🕐",
    title: "Free for 7 days",
    body: "Full access, no credit card required. Explore at your own pace.",
  },
  {
    icon: "🤝",
    title: "Advisor-built, not guessed at",
    body: "Developed from 25+ years of real estate, mortgage, and investment experience.",
  },
];

const FAQ = [
  {
    q: "Do I need a credit card to try a tool?",
    a: "No. Every tool includes a 7-day free trial with no credit card required. If it's not useful to you, do nothing — there's nothing to cancel.",
  },
  {
    q: "What happens after my free trial?",
    a: "You'll see your plan options directly in the tool once your 7-day trial ends — nothing is charged automatically without your say-so.",
  },
  {
    q: "Are these tools a substitute for professional advice?",
    a: "No. They're decision-support tools that organize information and calculations to help you evaluate a property, deal, or financing scenario. They don't replace independent due diligence, appraisal, underwriting by a lender, or advice from a licensed professional.",
  },
  {
    q: "Can I use more than one tool?",
    a: "Yes — each tool works on its own. Many users run Residential or Commercial Analysis alongside Financing Analysis on the same deal.",
  },
  {
    q: "How do I cancel?",
    a: "One click from your account page. No phone call, no email, no questions.",
  },
];

export default function LandingPage() {
  return (
    <div>
      {/* HERO */}
      <section className="bg-gradient-to-b from-navy-deep to-navy px-4 pb-14 pt-11 text-center text-white sm:px-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.09em] text-gold-light">
          Now live · Three tools, one login
        </p>
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight sm:text-4xl">
          The deal looks good. Do the numbers agree?
        </h1>
        <p className="mx-auto mt-3.5 max-w-md text-base text-[#c9d4e3]">
          See a real sample of the output before you sign up — built by a working broker and
          mortgage professional, not a software team guessing at the workflow.
        </p>
        <div className="mx-auto mt-7 max-w-md overflow-hidden rounded-2xl border border-white/10 shadow-[0_18px_40px_rgba(10,26,46,0.22)]">
          <Image
            src="/images/hero.jpg"
            alt="USIG Decision Tools — Residential, Commercial, Financing overview"
            width={900}
            height={900}
            className="w-full"
            priority
          />
        </div>
        <div className="mt-7">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3.5 text-[15px] font-bold text-navy-deep hover:bg-gold-light"
          >
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* TOOL SECTIONS */}
      {TOOL_SECTIONS.map((section, i) => (
        <section
          key={section.key}
          className={`border-b border-border px-4 py-14 sm:px-6 ${i % 2 === 1 ? "bg-[#f7f5ef]" : ""}`}
        >
          <div
            className={`mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2 md:gap-12 ${
              section.reverse ? "md:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(10,26,46,0.22)]">
              <Image
                src={section.image}
                alt={`${section.tag} — sample output`}
                width={900}
                height={900}
                className="w-full"
              />
            </div>
            <div>
              <span className="mb-3.5 inline-block rounded-full bg-gold/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold-dark">
                {section.tag}
              </span>
              <h2 className="mb-3 text-xl font-extrabold text-navy-deep sm:text-2xl">
                {section.heading}
              </h2>
              <p className="mb-5 text-[15px] text-ink/60">{section.body}</p>
              <Link
                href={`/login?tool=${section.key}`}
                className="inline-block rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy-deep hover:bg-gold-light"
              >
                {section.cta}
              </Link>
              <p className="mt-3 text-xs text-ink/50">7-day free trial · no credit card required</p>
            </div>
          </div>
        </section>
      ))}

      {/* AI FOLLOW-UP */}
      <section className="bg-navy-deep px-4 py-14 text-white sm:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="overflow-hidden rounded-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
            <Image
              src="/images/ai-followup.jpg"
              alt="Let AI handle the follow-up — keep the judgment human"
              width={900}
              height={900}
              className="w-full"
            />
          </div>
          <div>
            <span className="mb-3.5 inline-block rounded-full bg-gold/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-gold-light">
              Included with every tool
            </span>
            <h2 className="mb-3 text-xl font-extrabold sm:text-2xl">
              Let AI handle the follow-up. Keep the judgment human.
            </h2>
            <p className="text-[15px] text-[#c9d4e3]">
              Tom, your AI deal assistant, calls to confirm the report was received, answers
              straightforward questions from it, and flags anything that needs you — so you stay
              focused on judgment and the close, not chasing replies.
            </p>
          </div>
        </div>
      </section>

      {/* WHY USIG */}
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="text-xl font-extrabold text-navy-deep sm:text-2xl">
            Why brokers and lenders use USIG
          </h2>
        </div>
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {WHY_CARDS.map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-border bg-[#fbfaf7] p-6 text-center"
            >
              <div className="mb-2 text-2xl">{card.icon}</div>
              <h4 className="mb-1.5 text-sm font-semibold text-navy-deep">{card.title}</h4>
              <p className="text-[13px] text-ink/60">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* COMPARE / PRICING */}
      <section id="pricing" className="bg-[#fbfaf7] px-4 py-14 sm:px-6">
        <div className="mx-auto mb-8 max-w-xl text-center">
          <h2 className="text-xl font-extrabold text-navy-deep sm:text-2xl">Compare the tools</h2>
          <p className="mt-1.5 text-sm text-ink/60">
            Each tool works on its own. Free for 7 days — no credit card required.
          </p>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCT_LIST.map((product) => (
            <PricingCard
              key={product.key}
              product={product}
              cta={
                <Link
                  href={`/login?tool=${product.key}`}
                  className="block w-full rounded-lg bg-gold px-4 py-2.5 text-center text-sm font-bold text-navy-deep hover:bg-gold-light"
                >
                  Start Free Trial
                </Link>
              }
            />
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border px-4 py-12 sm:px-6">
        <div className="mx-auto mb-6 max-w-2xl text-center">
          <h2 className="text-xl font-extrabold text-navy-deep sm:text-2xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mx-auto max-w-2xl">
          {FAQ.map((item) => (
            <div key={item.q} className="border-b border-border py-4">
              <h4 className="mb-1.5 text-sm font-semibold text-navy-deep">{item.q}</h4>
              <p className="text-[13.5px] text-ink/60">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-navy-deep px-4 py-12 text-center text-white sm:px-6">
        <h3 className="mb-2 text-xl font-bold sm:text-2xl">
          See it for yourself — free for 7 days
        </h3>
        <p className="mb-5 text-sm text-[#c9d4e3]">
          No credit card required. Explore any tool at your own pace.
        </p>
        <Link
          href="/login"
          className="inline-block rounded-lg bg-gold px-6 py-3.5 text-[15px] font-bold text-navy-deep hover:bg-gold-light"
        >
          Start Your Free Trial
        </Link>
      </section>
    </div>
  );
}
