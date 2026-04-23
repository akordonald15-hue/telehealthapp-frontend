import { Suspense } from "react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Step 1 of 3: confirm your email, then create your LifeFirst profile.">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
