import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { isProductKey } from "@/lib/products";
import { sendSubscriptionConfirmationEmail, sendCancellationEmail } from "@/lib/email";

export const runtime = "nodejs";

function mapStatus(stripeStatus: Stripe.Subscription.Status): {
  plan: "free" | "paid";
  status: "active" | "past_due" | "canceled";
} {
  if (stripeStatus === "canceled") return { plan: "free", status: "active" };
  if (stripeStatus === "active") return { plan: "paid", status: "active" };
  if (stripeStatus === "past_due") return { plan: "paid", status: "past_due" };
  // incomplete / incomplete_expired / unpaid / paused — never lock out,
  // fall back to metered free access until the subscription resolves.
  return { plan: "paid", status: "past_due" };
}

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata.supabase_user_id;
  const product = sub.metadata.product;
  if (!userId || !product || !isProductKey(product)) return;

  const { plan, status } = mapStatus(sub.status);
  const priceId = sub.items.data[0]?.price.id ?? null;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

  const admin = createAdminClient();
  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      product,
      plan,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status,
      price_id: priceId,
      current_period_end: sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,product" }
  );

  return { userId, product, priceId };
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: `signature_verification_failed` }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) break;

      const sub = await stripe.subscriptions.retrieve(session.subscription as string);
      const result = await upsertFromSubscription(sub);
      if (!result) break;

      const { data: profile } = await admin
        .from("profiles")
        .select("email, full_name, display_name")
        .eq("id", result.userId)
        .maybeSingle();

      if (profile?.email) {
        const price = sub.items.data[0]?.price;
        const amount = price?.unit_amount ? `$${(price.unit_amount / 100).toFixed(2)}` : "";
        const interval = price?.recurring?.interval === "year" ? "annual" : "monthly";
        await sendSubscriptionConfirmationEmail(
          profile.email,
          profile.display_name || profile.full_name,
          result.product,
          amount,
          interval
        );
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const previous = (event.data as any).previous_attributes as
        | Partial<Stripe.Subscription>
        | undefined;

      await upsertFromSubscription(sub);

      // Scheduled-cancellation transition (user just clicked "cancel" in the
      // portal) — send the cancellation email now, referencing the date
      // access actually ends. The eventual subscription.deleted webhook at
      // period end just performs the silent downgrade.
      if (previous?.cancel_at_period_end === false && sub.cancel_at_period_end === true) {
        const userId = sub.metadata.supabase_user_id;
        if (userId) {
          const { data: profile } = await admin
            .from("profiles")
            .select("email, full_name, display_name")
            .eq("id", userId)
            .maybeSingle();
          if (profile?.email && sub.current_period_end) {
            const accessUntil = new Date(sub.current_period_end * 1000).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            );
            await sendCancellationEmail(
              profile.email,
              profile.display_name || profile.full_name,
              accessUntil
            );
          }
        }
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await upsertFromSubscription(sub);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      if (invoice.subscription) {
        const sub = await stripe.subscriptions.retrieve(invoice.subscription as string);
        await upsertFromSubscription(sub);
      }
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
