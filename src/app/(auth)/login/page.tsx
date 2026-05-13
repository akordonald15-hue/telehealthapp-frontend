import { Suspense } from "react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome back" subtitle="Continue with Google or sign in with your email and password.">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
