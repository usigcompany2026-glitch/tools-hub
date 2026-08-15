"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=${encodeURIComponent(
        "/account/update-password"
      )}`,
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-2 text-sm text-ink/70">
        Enter your email and we&apos;ll send you a link to set a new password. This works whether
        you already have a password or are setting one for the first time.
      </p>

      {status === "sent" ? (
        <div className="mt-8 rounded border border-border bg-white p-4 text-sm text-ink">
          Check your email for a password reset link.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-3">
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-60"
          >
            {status === "sending" ? "Sending…" : "Send reset link"}
          </button>
          {status === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-ink/60 underline hover:text-accent">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
