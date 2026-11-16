import { RequireAuth } from "@/components/layout/require-auth";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
