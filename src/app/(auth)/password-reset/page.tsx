import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { PasswordResetForm } from "@/features/auth/password-reset-form";

export default function PasswordResetPage() {
  return (
    <AuthSplitLayout>
      <PasswordResetForm />
    </AuthSplitLayout>
  );
}
