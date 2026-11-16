import { AuthLayout } from "@/components/layout/auth-layout";
import { ChangePasswordForm } from "@/features/auth/change-password-form";

export default function ChangePasswordPage() {
  return (
    <AuthLayout title="Set your password" subtitle="Use your temporary password one last time, then choose the one you will keep using.">
      <ChangePasswordForm />
    </AuthLayout>
  );
}
