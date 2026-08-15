"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "unauthenticated" };
  }

  const fullName = String(formData.get("full_name") || "").trim() || null;
  const displayName = String(formData.get("display_name") || "").trim() || null;
  const company = String(formData.get("company") || "").trim() || null;
  const phone = String(formData.get("phone") || "").trim() || null;
  const nmlsId = String(formData.get("nmls_id") || "").trim() || null;
  const dreLicense = String(formData.get("dre_license") || "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      display_name: displayName,
      company,
      phone,
      nmls_id: nmlsId,
      dre_license: dreLicense,
    })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/account/profile");
  return { ok: true };
}
