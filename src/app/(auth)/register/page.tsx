import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import { AuthVisualPanel } from "@/components/layout/auth-visual-panel";
import { SignupFlow } from "@/features/auth/signup/signup-flow";
import { SignupPreview } from "@/features/auth/signup/signup-preview";

type RegisterPageProps = {
  searchParams: Promise<{
    preview?: string | string[];
    stage?: string | string[];
    state?: string | string[];
    verified?: string | string[];
    email?: string | string[];
    ref?: string | string[];
  }>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const preview = first(params.preview);

  const visual = (
    <AuthVisualPanel
      headline="A Better place to get care that puts your family first"
      subline="With caretekk you can find care solutions"
    />
  );

  if (preview === "split" && process.env.NODE_ENV !== "production") {
    const stage = first(params.stage);
    const state = first(params.state);

    return (
      <AuthSplitLayout visual={visual}>
        <SignupPreview
          stage={stage === "account" ? "account" : "email"}
          state={state === "filled" || state === "error" ? state : "empty"}
        />
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout visual={visual}>
      <SignupFlow
        verified={first(params.verified) === "1"}
        emailFromUrl={first(params.email)}
        referralFromUrl={first(params.ref)}
      />
    </AuthSplitLayout>
  );
}
