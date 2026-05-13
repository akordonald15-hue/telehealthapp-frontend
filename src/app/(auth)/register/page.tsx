import { Suspense } from "react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout title="Create your account" subtitle="Start with your email, confirm the code we send, and finish your patient account.">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
