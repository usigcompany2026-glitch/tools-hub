"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PRODUCTS, isProductKey } from "@/lib/products";
import { signIn } from "./actions";

const CALLBACK_ERROR_MESSAGES: Record<string, string> = {
  missing_code: "That link is missing information. Please sign in again.",
  auth_failed: "That link is invalid or has expired. Please sign in again.",
};

export default function LoginForm() {
  const searchParams = useSearchParams();
  const tool = searchParams.get("tool");
  const next = searchParams.get("next");
  const callbackError = searchParams.get("error");
  const toolName = tool && isProductKey(tool) ? PRODUCTS[tool].name : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function destination() {
    if (next) return next;
    if (tool && isProductKey(tool)) return `/tools/${PRODUCTS[tool].slug}`;
    return "/";
  }

  function forgotPasswordHref() {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (tool) params.set("tool", tool);
    if (next) params.set("next", next);
    const qs = params.toString();
    return `/login/forgot-password${qs ? `?${qs}` : ""}`;
  }

  function signupHref() {
    const params = new URLSearchParams();
    if (tool) params.set("tool", tool);
    if (next) params.set("next", next);
    const qs = params.toString();
    return `/signup${qs ? `?${qs}` : ""}`;
  }

  function oauthRedirectTo() {
    const params = new URLSearchParams();
    if (tool) params.set("tool", tool);
    if (next) params.set("next", next);
    const qs = params.toString();
    return `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback${qs ? `?${qs}` : ""}`;
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    const result = await signIn({ email, password, destination: destination() });
    if (result?.error) {
      setStatus("error");
      setErrorMessage(result.error);
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: oauthRedirectTo() },
    });
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink/70">
        {toolName ? `Continue to ${toolName}.` : "Access your USIG Decision Tools account."}
      </p>

      {callbackError && (
        <div className="mt-6 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {CALLBACK_ERROR_MESSAGES[callbackError] ?? "Something went wrong. Please sign in again."}
        </div>
      )}

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

      <form onSubmit={handleSignIn} className="space-y-3">
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
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-60"
        >
          {status === "loading" ? "Signing in…" : "Sign in"}
        </button>
        {status === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
      </form>

      <p className="mt-4 flex justify-center gap-4 text-center text-sm">
        <Link href={forgotPasswordHref()} className="text-ink/60 underline hover:text-accent">
          Forgot password?
        </Link>
        <Link href={signupHref()} className="text-ink/60 underline hover:text-accent">
          Create an account
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
