"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PRODUCTS, isProductKey } from "@/lib/products";

export default function SignupForm() {
  const searchParams = useSearchParams();
  const tool = searchParams.get("tool");
  const next = searchParams.get("next");
  const toolName = tool && isProductKey(tool) ? PRODUCTS[tool].name : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function destination() {
    if (next) return next;
    if (tool && isProductKey(tool)) return `/tools/${PRODUCTS[tool].slug}`;
    return "/";
  }

  function loginHref() {
    const params = new URLSearchParams();
    if (tool) params.set("tool", tool);
    if (next) params.set("next", next);
    const qs = params.toString();
    return `/login${qs ? `?${qs}` : ""}`;
  }

  function redirectTo(path: string) {
    const params = new URLSearchParams();
    if (tool) params.set("tool", tool);
    if (next) params.set("next", next);
    const qs = params.toString();
    return `${process.env.NEXT_PUBLIC_SITE_URL}${path}${qs ? `?${qs}` : ""}`;
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("error");
      setErrorMessage("Passwords don't match.");
      return;
    }
    setStatus("loading");
    setErrorMessage("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo("/auth/callback") },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.includes("already registered") || error.message.includes("already exists")
          ? "An account with that email already exists. Try signing in instead."
          : error.message
      );
      return;
    }
    if (data.session) {
      // Email confirmation is off — session is live immediately.
      window.location.href = destination();
      return;
    }
    // Email confirmation is required before a session exists.
    setStatus("sent");
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo("/auth/callback") },
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-2 text-sm text-ink/70">
        {toolName ? `Get started with ${toolName}.` : "Access all USIG Decision Tools, free to start."}
      </p>

      {status === "sent" ? (
        <div className="mt-8 rounded border border-border bg-white p-4 text-sm text-ink">
          Check your email to confirm your account before signing in.
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

          <form onSubmit={handleSignUp} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <input
              type="password"
              required
              minLength={8}
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-60"
            >
              {status === "loading" ? "Creating account…" : "Create account"}
            </button>
            {status === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
          </form>
        </>
      )}

      <p className="mt-4 text-center text-sm">
        <Link href={loginHref()} className="text-ink/60 underline hover:text-accent">
          Already have an account? Sign in
        </Link>
      </p>

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
