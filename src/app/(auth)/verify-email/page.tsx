import { AuthLayout } from "@/components/layout/auth-layout";
import { EmailVerificationForm } from "@/features/auth/email-verification-form";

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="Verify email" subtitle="Login is blocked by the backend until email verification succeeds.">
      <EmailVerificationForm />
    </AuthLayout>
  );
}
