import "server-only";
import { Resend } from "resend";
import { PRODUCTS, type ProductKey } from "./products";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Brenda Le Jones <brenda@usig.ai>";

const SIGNATURE = `Brenda Le Jones
CA DRE #01365151 · NMLS #2274027`;

function firstNameOf(name: string | null | undefined): string {
  if (!name) return "there";
  return name.trim().split(/\s+/)[0];
}

export async function sendWelcomeEmail(to: string, name: string | null) {
  const first = firstNameOf(name);
  const text = `${first},

You're in. All three tools are unlocked on the free plan:

→ Residential Analysis — 3 property analyses a month
→ Commercial Analysis — 1 underwrite a month
→ Financing Analysis — 5 scenarios a month

No credit card, no expiry. Upgrade any tool when you need more.

One more thing. These tools cover the standard analysis. If you're working on something that needs more — an unusual structure, a deal you want a second set of eyes on, or a client situation the tool doesn't quite fit — just reply to this email. I do custom work and advisory for exactly those situations.

${SIGNATURE}`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Your USIG Decision Tools account is ready",
    text,
  });
}

export async function sendSubscriptionConfirmationEmail(
  to: string,
  name: string | null,
  product: ProductKey,
  price: string,
  interval: "monthly" | "annual"
) {
  const first = firstNameOf(name);
  const toolName = PRODUCTS[product].name;
  const intervalWord = interval === "annual" ? "yearly" : "monthly";
  const text = `${first},

${toolName} is now unlimited. You're billed ${price} ${intervalWord}, renewing until you cancel.

Cancel anytime: Account → Manage Subscription. One click, no call, no questions.

Brenda`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${toolName} — you're on the unlimited plan`,
    text,
  });
}

export async function sendCancellationEmail(to: string, name: string | null, accessUntil: string) {
  const first = firstNameOf(name);
  const text = `${first},

Done. Unlimited access continues through ${accessUntil}, then you'll return to the free plan — your saved work stays in your account.

If something didn't work, tell me: brenda@usig.ai

Brenda`;

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Cancelled — no further charges",
    text,
  });
}

export async function sendLeadNotification(lead: {
  email: string;
  phone?: string | null;
  sourceTool?: string | null;
  intent?: string | null;
  message?: string | null;
}) {
  const notify = process.env.NOTIFY_EMAIL;
  if (!notify) return;

  const text = `New enquiry from the tools hub contact form.

Email: ${lead.email}
Phone: ${lead.phone || "—"}
Tool: ${lead.sourceTool || "—"}
Intent: ${lead.intent || "—"}

Message:
${lead.message || "—"}`;

  await resend.emails.send({
    from: FROM,
    to: notify,
    replyTo: lead.email,
    subject: "New enquiry — USIG Decision Tools",
    text,
  });
}
