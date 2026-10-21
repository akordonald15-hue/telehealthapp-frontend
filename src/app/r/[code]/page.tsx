import type { Metadata } from "next";

import { ReferralLandingClient } from "@/features/referral-program/referral-landing-client";

export const metadata: Metadata = {
  title: "You've been invited to Caretekk",
  description: "Access online healthcare consultations from wherever you are. Online consultations are subject to practitioner eligibility, applicable regulations, and appointment availability. Home visits are currently available in Akwa Ibom State, Nigeria.",
};

/**
 * Public entry point for shared referral links. Lives outside the (app) and (auth) groups
 * because a visitor arriving here has no account yet and must not hit an auth guard.
 */
export default async function ReferralLandingPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return <ReferralLandingClient code={code} />;
}
