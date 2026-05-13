import { Suspense } from "react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthLayout title="Sign in" subtitle="Continue with your email, password, or Google account.">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
