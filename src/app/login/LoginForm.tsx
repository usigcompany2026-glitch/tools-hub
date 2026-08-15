"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PRODUCTS, isProductKey } from "@/lib/products";

export default function LoginForm() {
  const searchParams = useSearchParams();
  const tool = searchParams.get("tool");
  const next = searchParams.get("next");
  const toolName = tool && isProductKey(tool) ? PRODUCTS[tool].name : null;

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function callbackUrl() {
    const params = new URLSearchParams();
    if (tool) params.set("tool", tool);
    if (next) params.set("next", next);
    const qs = params.toString();
    return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback${qs ? `?${qs}` : ""}`;
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl() },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
    } else {
      setStatus("sent");
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl() },
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink/70">
        {toolName ? `Continue to ${toolName}.` : "Access your USIG Decision Tools account."}
      </p>

      {status === "sent" ? (
        <div className="mt-8 rounded border border-border bg-white p-4 text-sm text-ink">
          Check your email for a sign-in link. You can close this tab.
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            className="mt-8 flex w-full items-center justify-center rounded border border-border bg-white px-4 py-2.5 text-sm font-medium text-ink hover:bg-paper"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-ink/40">
            <div className="h-px flex-1 bg-border" />
            or
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleMagicLink} className="space-y-3">
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
              {status === "sending" ? "Sending…" : "Send magic link"}
            </button>
            {status === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
          </form>
        </>
      )}

      <p className="mt-8 text-xs text-ink/50">
        By continuing you agree to our{" "}
        <a href="/legal/terms" className="underline">
          Terms
        </a>{" "}
        and{" "}
        <a href="/legal/privacy" className="underline">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}
