"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setStatus("error");
      setErrorMessage("Passwords don't match.");
      return;
    }
    setStatus("saving");
    setErrorMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }
    window.location.href = "/account";
  }

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold text-ink">Set a new password</h1>
      <p className="mt-2 text-sm text-ink/70">Choose a password for your account.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-3">
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
          disabled={status === "saving"}
          className="w-full rounded bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-60"
        >
          {status === "saving" ? "Saving…" : "Save password"}
        </button>
        {status === "error" && <p className="text-sm text-red-700">{errorMessage}</p>}
      </form>
    </div>
  );
}
