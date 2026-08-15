import "server-only";
import type { Role } from "./roles";
import type { ProductKey } from "./products";

/**
 * Pushes to the real "Subscribers" table in the "USIG Tools Hub Subscribers"
 * Airtable base — field names and select options below are copied exactly
 * from that base's live schema (base appJxjbSCfHRseOJJ, table
 * tblx1FlsnbR80VjdP), not guessed.
 */
const AIRTABLE_BASE_ID = "appJxjbSCfHRseOJJ";
const AIRTABLE_TABLE_ID = "tblx1FlsnbR80VjdP";

const ROLE_LABELS: Record<Role, string> = {
  real_estate: "Real Estate Broker / Agent",
  mortgage: "Mortgage Broker / Loan Officer",
  investor_other: "Investor / Other",
};

const TOOL_LABELS: Record<ProductKey, string> = {
  residential: "Residential Analysis",
  commercial: "Commercial Analysis",
  financing: "Financing Analysis",
};

/**
 * Best-effort — requires AIRTABLE_API_KEY (a Personal Access Token with
 * write access to the base above). Never throws: a missing key or a failed
 * request must not block signup, same convention as the email senders.
 */
export async function pushNewSubscriberToAirtable(subscriber: {
  fullName: string | null;
  email: string;
  role: Role;
  licenseNumber: string | null;
  startedFromTool: ProductKey | null;
}): Promise<void> {
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!apiKey) return;

  try {
    await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          "Full Name": subscriber.fullName || subscriber.email,
          Email: subscriber.email,
          Role: ROLE_LABELS[subscriber.role],
          ...(subscriber.licenseNumber ? { "License Number": subscriber.licenseNumber } : {}),
          "Started From Tool": subscriber.startedFromTool
            ? TOOL_LABELS[subscriber.startedFromTool]
            : "Home / General",
          "Signed Up At": new Date().toISOString(),
          "Follow-Up Status": "New",
        },
      }),
    });
  } catch {
    // Best-effort — never block signup on Airtable being down or misconfigured.
  }
}
