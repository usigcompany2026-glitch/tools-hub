import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Tell us what you're working on — custom analysis and advisory beyond the tools.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">Tell us what you&apos;re working on</h1>
      <p className="mt-3 text-ink/70">
        The tools handle standard analysis. If you have something unusual — a deal you want a
        second set of eyes on, a structure the tool doesn&apos;t fit, or a client situation that
        needs judgment — we do custom work.
      </p>

      <div className="mt-10">
        <ContactForm />
      </div>
    </div>
  );
}
