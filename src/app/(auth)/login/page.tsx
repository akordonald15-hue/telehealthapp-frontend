import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in with the email and password registered with the backend.">
      <LoginForm />
    </AuthLayout>
  );
}
