"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Step = "email" | "code" | "password";

export default function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    const supabase = createClient();
    // No redirectTo — this flow never follows a link. The email template's
    // {{ .Token }} is what carries the 6-digit code entered below, so a
    // scanner/prefetcher visiting a link can't consume it before the user does.
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setStatus("idle");
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });
    setStatus("idle");
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    setStep("password");
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setErrorMessage("Passwords don't match.");
      return;
    }
    setStatus("loading");
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setStatus("idle");
    if (error) {
      setErrorMessage(error.message);
      return;
    }
    window.location.href = "/account";
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      {step === "email" && (
        <>
          <h1 className="text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="mt-2 text-sm text-ink/70">
            Enter your email and we&apos;ll send you a 6-digit code. This works whether you
            already have a password or are setting one for the first time.
          </p>
          <form onSubmit={handleSendCode} className="mt-8 space-y-3">
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
              disabled={status === "loading"}
              className="w-full rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-60"
            >
              {status === "loading" ? "Sending…" : "Send code"}
            </button>
            {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}
          </form>
        </>
      )}

      {step === "code" && (
        <>
          <h1 className="text-2xl font-semibold text-ink">Enter your code</h1>
          <p className="mt-2 text-sm text-ink/70">
            Check your email for a 6-digit code and enter it below. Sent to {email}.
          </p>
          <form onSubmit={handleVerifyCode} className="mt-8 space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded border border-border px-4 py-2.5 text-center text-lg tracking-[0.4em] focus:border-accent focus:outline-none"
            />
            <button
              type="submit"
              disabled={status === "loading" || code.length !== 6}
              className="w-full rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-60"
            >
              {status === "loading" ? "Verifying…" : "Verify code"}
            </button>
            {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}
          </form>
        </>
      )}

      {step === "password" && (
        <>
          <h1 className="text-2xl font-semibold text-ink">Set a new password</h1>
          <p className="mt-2 text-sm text-ink/70">Choose a new password for your account.</p>
          <form onSubmit={handleSetPassword} className="mt-8 space-y-3">
            <input
              type="password"
              required
              minLength={8}
              placeholder="New password"
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
              {status === "loading" ? "Saving…" : "Save password"}
            </button>
            {errorMessage && <p className="text-sm text-red-700">{errorMessage}</p>}
          </form>
        </>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-ink/60 underline hover:text-accent">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
