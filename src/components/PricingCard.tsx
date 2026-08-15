import type { ReactNode } from "react";
import type { ProductConfig } from "@/lib/products";
import { freeLine } from "@/lib/products";

export default function PricingCard({
  product,
  cta,
}: {
  product: ProductConfig;
  cta: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-white p-6">
      <h3 className="text-lg font-semibold text-ink">{product.name}</h3>
      <div className="mt-3">
        <span className="text-3xl font-semibold text-ink">
          ${product.monthlyPrice % 1 === 0 ? product.monthlyPrice : product.monthlyPrice.toFixed(2)}
        </span>
        <span className="text-sm text-ink/60">/month</span>
      </div>
      <p className="mt-1 text-sm text-ink/60">
        or ${product.annualPrice % 1 === 0 ? product.annualPrice : product.annualPrice.toFixed(2)}/year
      </p>

      <ul className="mt-6 flex-1 space-y-3 text-sm text-ink/80">
        {product.features.map((feature, i) => (
          <li key={feature} className="flex gap-2">
            <span aria-hidden className="text-accent">
              —
            </span>
            <span className={i === product.boldFeatureIndex ? "font-semibold text-ink" : ""}>
              {feature}
            </span>
          </li>
        ))}
        <li className="flex gap-2">
          <span aria-hidden className="text-accent">
            —
          </span>
          <span>{freeLine(product.key)}</span>
        </li>
      </ul>

      <div className="mt-6">{cta}</div>
    </div>
  );
}
