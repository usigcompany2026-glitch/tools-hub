import type { Metadata } from "next";
import ToolPageContent from "../ToolPageContent";

export const metadata: Metadata = {
  title: "USIG Residential Analysis — Property Deal Analysis",
  description:
    "Enter an address, get a complete deal analysis. Compare multiple properties side by side. Free: 3 analyses a month. Paid: unlimited at $29.99/month.",
  alternates: { canonical: "/tools/residential" },
};

export default function Page() {
  return <ToolPageContent productKey="residential" />;
}
