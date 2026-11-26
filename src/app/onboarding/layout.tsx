// The auth gate lives on the page's real flow (see page.tsx), not here, so the
// QA-only `?preview=` surface can render without a session.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
