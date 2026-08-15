import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendLeadNotification } from "@/lib/email";

const VALID_INTENTS = ["advisory", "custom_work", "financing", "question"];

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : null;
  const sourceTool = typeof body?.sourceTool === "string" ? body.sourceTool : null;
  const intent = VALID_INTENTS.includes(body?.intent) ? body.intent : null;
  const message = typeof body?.message === "string" ? body.message.trim() : null;

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("leads").insert({
    user_id: user?.id ?? null,
    email,
    phone,
    source_tool: sourceTool,
    intent,
    message,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await sendLeadNotification({ email, phone, sourceTool, intent, message });

  return NextResponse.json({ ok: true });
}
