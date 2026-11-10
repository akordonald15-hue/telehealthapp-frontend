"use client";

import { useRouter } from "next/navigation";

import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <main className="relative min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_rgba(136,160,203,0.18),_transparent_28%),linear-gradient(180deg,#F9FAFB_0%,#F9FAFB_42%,#FFFFFF_100%)]">
      <OnboardingFlow onComplete={() => router.replace("/dashboard")} />
    </main>
  );
}
