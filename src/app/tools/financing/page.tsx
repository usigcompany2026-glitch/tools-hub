import type { Metadata } from "next";
import ToolPageContent from "../ToolPageContent";

export const metadata: Metadata = {
  title: "USIG Financing Analysis — Loan Structure Matching",
  description:
    "Match any scenario to the loan structures that fit, residential and commercial. Personalized with your name and NMLS ID. Free: 5 scenarios a month. Paid: unlimited at $49/month.",
  alternates: { canonical: "/tools/financing" },
};

export default function Page() {
  return <ToolPageContent productKey="financing" />;
}
