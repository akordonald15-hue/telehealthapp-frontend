import { Suspense } from "react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { EmailVerificationForm } from "@/features/auth/email-verification-form";

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="Confirm your email" subtitle="Step 2 of 3: confirm your email so we can safely continue your onboarding.">
      <Suspense fallback={null}>
        <EmailVerificationForm />
      </Suspense>
    </AuthLayout>
  );
}
