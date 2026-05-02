import { Suspense } from "react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout title="Create patient account" subtitle="Step 1 of 3: confirm your email, then create your Caretekk patient profile. Doctor and nurse accounts are created by Caretekk admin.">
      <Suspense fallback={null}>
        <RegisterForm />
      </Suspense>
    </AuthLayout>
  );
}
