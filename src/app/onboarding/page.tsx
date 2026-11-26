import { RequireAuth } from "@/components/layout/require-auth";
import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";
import { OnboardingPreview } from "@/features/onboarding/onboarding-preview";

type OnboardingPageProps = {
  searchParams: Promise<{ preview?: string | string[] }>;
};

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const { preview } = await searchParams;

  // QA-only visual surface: no session, no API calls. Keep it outside the gate
  // so the Figma states can be reviewed on a clean machine. Not exposed in production.
  if (preview && process.env.NODE_ENV !== "production") {
    const previewKey = (Array.isArray(preview) ? preview[0] : preview) || "welcome-empty";
    return <OnboardingPreview key={previewKey} initialPreview={preview} />;
  }

  return (
    <RequireAuth>
      <OnboardingFlow />
    </RequireAuth>
  );
}
