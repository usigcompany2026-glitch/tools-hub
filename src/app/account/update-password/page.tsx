import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UpdatePasswordForm from "./UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Set a new password",
  alternates: { canonical: "/account/update-password" },
};

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/account/update-password");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <UpdatePasswordForm />
    </div>
  );
}
