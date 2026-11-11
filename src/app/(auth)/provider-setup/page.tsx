import { Suspense } from "react";

import { AuthLayout } from "@/components/layout/auth-layout";
import { ProviderSetupForm } from "@/features/auth/provider-setup-form";

export default function ProviderSetupPage() {
  return (
    <AuthLayout title="Complete provider setup" subtitle="Choose your password to activate your Caretekk provider account.">
      <Suspense fallback={<div className="text-center text-sm text-ash-600">Checking your setup link...</div>}>
        <ProviderSetupForm />
      </Suspense>
    </AuthLayout>
  );
}
