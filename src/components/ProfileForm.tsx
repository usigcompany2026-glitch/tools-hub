"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/app/account/profile/actions";

interface ProfileData {
  full_name: string | null;
  display_name: string | null;
  company: string | null;
  phone: string | null;
  nmls_id: string | null;
  dre_license: string | null;
}

function Field({
  label,
  name,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1.5 w-full rounded border border-border px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  );
}

export default function ProfileForm({ profile }: { profile: ProfileData }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      setStatus(result?.error ? "error" : "saved");
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" name="full_name" defaultValue={profile.full_name} />
        <Field
          label="Display name"
          name="display_name"
          defaultValue={profile.display_name}
          hint="Shown on personalized financing outputs."
        />
        <Field label="Company" name="company" defaultValue={profile.company} />
        <Field label="Phone" name="phone" defaultValue={profile.phone} />
        <Field
          label="NMLS ID"
          name="nmls_id"
          defaultValue={profile.nmls_id}
          hint="Required before generating client-facing Financing Analysis reports."
        />
        <Field label="DRE license number" name="dre_license" defaultValue={profile.dre_license} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-light disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" && <span className="text-sm text-accent">Saved.</span>}
        {status === "error" && <span className="text-sm text-red-700">Couldn&apos;t save. Try again.</span>}
      </div>
    </form>
  );
}
