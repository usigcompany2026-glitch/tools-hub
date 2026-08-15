import { Suspense } from "react";
import type { Metadata } from "next";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Get a link to set or reset your USIG Decision Tools password.",
  alternates: { canonical: "/login/forgot-password" },
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
