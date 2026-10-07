import type { Metadata } from "next";

import { ReferralLandingClient } from "@/features/referral-program/referral-landing-client";

export const metadata: Metadata = {
  title: "You've been invited to Caretekk",
  description: "Speak with doctors and access home-care services from Caretekk.",
};

/**
 * Public entry point for shared referral links. Lives outside the (app) and (auth) groups
 * because a visitor arriving here has no account yet and must not hit an auth guard.
 */
export default async function ReferralLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ReferralLandingClient code={code} />;
}
