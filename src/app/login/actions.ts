"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(params: {
  email: string;
  password: string;
  destination: string;
}): Promise<{ error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: params.email,
    password: params.password,
  });
  if (error) {
    return {
      error:
        error.message === "Invalid login credentials"
          ? "Invalid email or password."
          : error.message,
    };
  }
  redirect(params.destination);
}
