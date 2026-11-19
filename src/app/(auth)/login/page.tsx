import { Suspense } from "react";

import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { ProfileTickIcon } from "@/features/auth/auth-icons";
import { AuthCard } from "@/features/auth/auth-ui";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <AuthCard
        icon={<ProfileTickIcon className="h-6 w-6" />}
        title="Welcome to Caretekk"
        subtitle="Kindly input your details to sign-in"
      >
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </AuthCard>
    </AuthSplitLayout>
  );
}
