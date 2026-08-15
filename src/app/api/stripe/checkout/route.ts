import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { PRODUCTS, displayPrice, isProductKey, priceIdFor, type Interval } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL!;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const product = body?.product;
  const interval: Interval = body?.interval === "annual" ? "annual" : "monthly";

  if (!product || !isProductKey(product)) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const cfg = PRODUCTS[product];
  const priceId = priceIdFor(product, interval);
  const price = displayPrice(product, interval);

  // Reuse an existing Stripe customer for this user if one of their other
  // tool subscriptions already created one, so one Stripe customer covers
  // every product the user buys.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(existing?.stripe_customer_id
      ? { customer: existing.stripe_customer_id }
      : { customer_email: user.email }),
    client_reference_id: user.id,
    subscription_data: {
      metadata: { supabase_user_id: user.id, product },
    },
    consent_collection: { terms_of_service: "required" },
    custom_text: {
      submit: {
        message: `Your subscription begins today at ${price} and renews ${
          interval === "annual" ? "annually" : "monthly"
        } until cancelled. Cancel anytime from your account in one click.`,
      },
    },
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/welcome?product=${product}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/tools/${cfg.slug}`,
  });

  return NextResponse.json({ url: session.url });
}
