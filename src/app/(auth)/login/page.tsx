import { UserRound } from "lucide-react";
import { Suspense } from "react";

import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { AuthCard } from "@/features/auth/auth-ui";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <AuthSplitLayout>
      <AuthCard
        icon={<UserRound className="h-4 w-4" fill="currentColor" strokeWidth={0} />}
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
