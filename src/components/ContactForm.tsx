"use client";

import { useState } from "react";
import { PRODUCT_LIST } from "@/lib/products";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") || "").trim();
    const message = String(form.get("message") || "").trim();

    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        phone: form.get("phone"),
        sourceTool: form.get("tool"),
        message: name ? `Name: ${name}\n\n${message}` : message,
      }),
    });

    setStatus(res.ok ? "sent" : "error");
  }

  if (status === "sent") {
    return (
      <div className="rounded border border-border bg-white p-6 text-sm text-ink">
        Thanks — we&apos;ll be in touch shortly.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Name</span>
          <input
            name="name"
            required
            className="mt-1.5 w-full rounded border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <input
            type="email"
            name="email"
            required
            className="mt-1.5 w-full rounded border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Phone</span>
          <input
            type="tel"
            name="phone"
            className="mt-1.5 w-full rounded border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Which tool?</span>
          <select
            name="tool"
            className="mt-1.5 w-full rounded border border-border bg-white px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="general">Not sure / general</option>
            {PRODUCT_LIST.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-ink">Message</span>
        <textarea
          name="message"
          rows={5}
          required
          className="mt-1.5 w-full rounded border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send"}
      </button>
      {status === "error" && (
        <p className="text-sm text-red-700">Something went wrong — try again.</p>
      )}
    </form>
  );
}
