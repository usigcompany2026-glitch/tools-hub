import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isProductKey } from "@/lib/products";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const product = body?.product;

  if (!product || !isProductKey(product)) {
    return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  // Re-check server-side immediately before recording — never trust the
  // caller's own prior /usage/check result as authorization to record.
  const { data: check, error: checkError } = await supabase.rpc("can_run", {
    p_user: user.id,
    p_product: product,
  });

  if (checkError) {
    return NextResponse.json({ error: checkError.message }, { status: 500 });
  }

  if (!check.allowed) {
    return NextResponse.json({ allowed: false, ...check }, { status: 402 });
  }

  const { error } = await supabase.rpc("record_usage", {
    p_user: user.id,
    p_product: product,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ allowed: true });
}
