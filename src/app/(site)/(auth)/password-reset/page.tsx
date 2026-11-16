import { AuthLayout } from "@/components/layout/auth-layout";
import { PasswordResetForm } from "@/features/auth/password-reset-form";

export default function PasswordResetPage() {
  return (
    <AuthLayout title="Reset password" subtitle="Request a reset code, verify it, then choose a new password.">
      <PasswordResetForm />
    </AuthLayout>
  );
}
