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

  const { data, error } = await supabase.rpc("can_run", {
    p_user: user.id,
    p_product: product,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
