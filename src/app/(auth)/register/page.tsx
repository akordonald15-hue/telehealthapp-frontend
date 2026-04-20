import { AuthLayout } from "@/components/layout/auth-layout";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Choose the backend role that should be stored on your user record.">
      <RegisterForm />
    </AuthLayout>
  );
}
