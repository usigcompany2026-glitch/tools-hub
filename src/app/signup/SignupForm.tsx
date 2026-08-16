"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PRODUCTS, isProductKey } from "@/lib/products";
import { ROLE_LIST, roleConfig, isRole, type Role } from "@/lib/roles";
import { completeSignup } from "./actions";

export default function SignupForm() {
  const searchParams = useSearchParams();
  const tool = searchParams.get("tool");
  const next = searchParams.get("next");
  const toolName = tool && isProductKey(tool) ? PRODUCTS[tool].name : null;

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [step, setStep] = useState<"form" | "code">("form");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const licenseField = role && isRole(role) ? roleConfig(role).licenseField : null;
  const licenseLabel = role && isRole(role) ? roleConfig(role).licenseLabel : null;

  function destination() {
    if (next) return next;
    if (tool && isProductKey(tool)) return `/tools/${PRODUCTS[tool].slug}`;
    // Land on the account page, not the marketing home page — that's where a
    // new user can actually see and open all three trials.
    return "/account";
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
    if (!role) {
      setStatus("error");
      setErrorMessage("Select what best describes you.");
      return;
    }
    setStatus("loading");
    setErrorMessage("");
    const supabase = createClient();
    const meta = {
      full_name: fullName || null,
      role,
      license_number: licenseNumber || null,
      signup_tool: tool,
    };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo("/auth/callback"), data: meta },
    });
    if (error) {
      setStatus("error");
      setErrorMessage(
        error.message.toLowerCase().includes("already registered") ||
          error.message.toLowerCase().includes("already exists")
          ? "An account with that email already exists. Try signing in instead."
          : error.message
      );
      return;
    }
    if (data.session && data.user) {
      await completeSignup(data.user.id, email, meta);
      window.location.href = destination();
      return;
    }
    // No session yet: the account needs confirming. Collect the emailed code
    // here rather than relying on the link. A clickable confirmation link is
    // single-use, and mail scanners/prefetchers routinely open it before the
    // person does — which is what produced the "link is invalid" message on a
    // signup that had in fact already succeeded.
    setStatus("idle");
    setStep("code");
  }

  async function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    const supabase = createClient();
    const meta = {
      full_name: fullName || null,
      role: role || null,
      license_number: licenseNumber || null,
      signup_tool: tool,
    };

    // 'email' is what the Supabase JS reference specifies for "Verify Signup
    // One-Time Password". Note that EmailOtpType is `... | (string & {})`, so
    // TypeScript accepts any string here and the compiler cannot catch a wrong
    // value — this has to be right by reading the docs, not by building.
    let { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      // 'signup' is the older type for a confirm-signup token and is still in
      // the union. Retrying under it covers the case where this project's
      // GoTrue wants that value, which we cannot probe from here.
      ({ data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      }));
    }

    let user = data?.user ?? null;

    if (error) {
      // If something already consumed the confirmation (a prefetcher opening
      // the link), the account is confirmed and the code is spent. The
      // credentials they just chose are still valid, so sign in with those
      // instead of dead-ending on an error they can't act on.
      const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError || !signIn.user) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
      user = signIn.user;
    }

    if (user) {
      await completeSignup(user.id, email, meta);
    }
    window.location.href = destination();
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
        {toolName ? `Get started with ${toolName}.` : "7 days free on all three tools, no card required."}
      </p>

      {step === "code" ? (
        <form onSubmit={handleVerifyCode} className="mt-8 space-y-3">
          <p className="text-sm text-ink/70">
            We sent a confirmation code to {email}. Enter it below to finish setting up your
            account.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            required
            placeholder="Code from email"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full rounded border border-border px-4 py-2.5 text-center text-lg tracking-[0.4em] focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading" || code.length === 0}
            className="w-full rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-60"
          >
            {status === "loading" ? "Confirming…" : "Confirm account"}
          </button>
          {status === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
        </form>
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
              type="text"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
            />
            <select
              required
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded border border-border bg-white px-4 py-2.5 text-sm text-ink focus:border-accent focus:outline-none"
            >
              <option value="" disabled>
                What best describes you?
              </option>
              {ROLE_LIST.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.label}
                </option>
              ))}
            </select>
            {licenseField && (
              <input
                type="text"
                placeholder={licenseLabel ?? ""}
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full rounded border border-border px-4 py-2.5 text-sm focus:border-accent focus:outline-none"
              />
            )}
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
