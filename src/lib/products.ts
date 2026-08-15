export type ProductKey = "residential" | "commercial" | "financing";
export type Interval = "monthly" | "annual";

export interface ProductConfig {
  key: ProductKey;
  slug: string;
  name: string;
  unit: string; // plural: "analyses" | "underwrites" | "scenarios"
  unitSingular: string; // "analysis" | "underwrite" | "scenario"
  freeLimit: number;
  monthlyPrice: number;
  annualPrice: number;
  toolUrl: string;
  features: string[];
  boldFeatureIndex?: number;
}

export const PRODUCTS: Record<ProductKey, ProductConfig> = {
  residential: {
    key: "residential",
    slug: "residential",
    name: "USIG Residential Analysis",
    unit: "analyses",
    unitSingular: "analysis",
    freeLimit: 3,
    monthlyPrice: 29.99,
    annualPrice: 299,
    toolUrl: "https://deals-desk.usig.ai",
    features: [
      "Enter an address, get a complete deal analysis",
      "Analyze multiple properties at once and compare side by side",
      "One-page deal summary you can share with sellers or partners",
    ],
    boldFeatureIndex: 1,
  },
  commercial: {
    key: "commercial",
    slug: "commercial",
    name: "USIG Commercial Analysis",
    unit: "underwrites",
    unitSingular: "underwrite",
    freeLimit: 1,
    monthlyPrice: 99,
    annualPrice: 990,
    toolUrl: "https://cre-analysis.usig.ai",
    features: [
      "Commercial underwriting built to current banking standards",
      "Upload deal documents and analyze them in one place",
      "NOI, cap rate, coverage, and the risks that matter",
    ],
  },
  financing: {
    key: "financing",
    slug: "financing",
    name: "USIG Financing Analysis",
    unit: "scenarios",
    unitSingular: "scenario",
    freeLimit: 5,
    monthlyPrice: 49,
    annualPrice: 490,
    // Domain kept as-is (mortgage.usig.ai) — display name changed, address didn't.
    toolUrl: "https://mortgage.usig.ai",
    features: [
      "Match any scenario to the loan structures that fit — residential and commercial",
      "Understand what each program requires before you place it",
      "Personalized with your name and NMLS ID on every output",
    ],
  },
};

export const PRODUCT_LIST = Object.values(PRODUCTS);

export function isProductKey(value: string): value is ProductKey {
  return value === "residential" || value === "commercial" || value === "financing";
}

export function priceIdFor(product: ProductKey, interval: Interval): string {
  const map: Record<ProductKey, Record<Interval, string | undefined>> = {
    residential: {
      monthly: process.env.NEXT_PUBLIC_PRICE_RESIDENTIAL_MONTHLY,
      annual: process.env.NEXT_PUBLIC_PRICE_RESIDENTIAL_ANNUAL,
    },
    commercial: {
      monthly: process.env.NEXT_PUBLIC_PRICE_COMMERCIAL_MONTHLY,
      annual: process.env.NEXT_PUBLIC_PRICE_COMMERCIAL_ANNUAL,
    },
    financing: {
      monthly: process.env.NEXT_PUBLIC_PRICE_FINANCING_MONTHLY,
      annual: process.env.NEXT_PUBLIC_PRICE_FINANCING_ANNUAL,
    },
  };
  const priceId = map[product][interval];
  if (!priceId) {
    throw new Error(`Missing price id env var for ${product}/${interval}`);
  }
  return priceId;
}

export function unitLabel(product: ProductKey, count: number): string {
  const cfg = PRODUCTS[product];
  return count === 1 ? cfg.unitSingular : cfg.unit;
}

export function freeLine(product: ProductKey): string {
  const cfg = PRODUCTS[product];
  return `Free: ${cfg.freeLimit} ${unitLabel(product, cfg.freeLimit)} per month. Paid: unlimited.`;
}

export function displayPrice(product: ProductKey, interval: Interval): string {
  const cfg = PRODUCTS[product];
  const amount = interval === "monthly" ? cfg.monthlyPrice : cfg.annualPrice;
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}
