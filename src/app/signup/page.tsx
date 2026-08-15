import { Suspense } from "react";
import type { Metadata } from "next";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a USIG Decision Tools account with your email and password, or Google.",
  alternates: { canonical: "/signup" },
};

export default function SignupPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  );
}
