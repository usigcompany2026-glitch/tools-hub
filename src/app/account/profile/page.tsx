import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/ProfileForm";

export const metadata: Metadata = {
  title: "Your details",
  description: "Update the name, company, and license details shown on your reports.",
  alternates: { canonical: "/account/profile" },
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/profile");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, display_name, company, phone, nmls_id, dre_license")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-semibold text-ink">Your details</h1>
      <p className="mt-1 text-sm text-ink/60">These appear on reports you generate and share.</p>

      <div className="mt-8">
        <ProfileForm
          profile={
            profile ?? {
              full_name: null,
              display_name: null,
              company: null,
              phone: null,
              nmls_id: null,
              dre_license: null,
            }
          }
        />
      </div>

      <p className="mt-6 text-sm text-ink/60">
        Your NMLS ID appears on Financing Analysis outputs you share with clients. Required before
        generating client-facing reports.
      </p>
    </div>
  );
}
