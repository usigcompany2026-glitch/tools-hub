import type { Metadata } from "next";
import ToolPageContent from "../ToolPageContent";

export const metadata: Metadata = {
  title: "USIG Commercial Analysis — Commercial Underwriting",
  description:
    "Commercial underwriting built to current banking standards. NOI, cap rate, coverage, and the risks that matter. Free: 1 underwrite a month. Paid: unlimited at $99/month.",
  alternates: { canonical: "/tools/commercial" },
};

export default function Page() {
  return <ToolPageContent productKey="commercial" />;
}
