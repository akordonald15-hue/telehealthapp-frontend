"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { ApiError } from "@/lib/api/client";
import { referralProgramApi } from "@/lib/api/endpoints";
import type { MyReferralReward } from "@/lib/types/backend";

/** One key root, so a single invalidation refreshes every referral surface. */
export const referralProgramKeys = {
  root: ["referral-program"] as const,
  me: ["referral-program", "me"] as const,
  referrals: (page: number) => ["referral-program", "referrals", page] as const,
  rewards: (redeemableOnly: boolean) => ["referral-program", "rewards", redeemableOnly] as const,
};

/**
 * The backend returns 503 with this code when no programme is active. It is an operational
 * state, not an error to shout about and not a session problem: promotional surfaces hide
 * themselves and the rest of the app carries on.
 */
export const PROGRAMME_UNAVAILABLE_CODE = "REFERRAL_PROGRAM_UNAVAILABLE";

export function isProgrammeUnavailable(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }
  // The status alone is the reliable signal. The BFF proxy replaces the body of every upstream
  // 502/503/504 with its own generic envelope, so the backend's REFERRAL_PROGRAM_UNAVAILABLE
  // code does not survive the hop to the browser; checking only for the code meant this never
  // matched in the real app.
  //
  // Treating a genuine referral outage the same way is deliberate rather than a compromise:
  // these surfaces are promotional, both causes mean "invites are not available right now" to a
  // patient, and quietly degrading them leaves the rest of the app working either way.
  return error.status === 503;
}

/** True when the backend's own programme-unavailable code reached the client intact. */
export function hasProgrammeUnavailableCode(error: unknown) {
  if (!(error instanceof ApiError)) {
    return false;
  }
  const payload = error.payload as { code?: string; details?: { code?: string } } | null;
  return payload?.code === PROGRAMME_UNAVAILABLE_CODE || payload?.details?.code === PROGRAMME_UNAVAILABLE_CODE;
}

export function useReferralCode() {
  return useQuery({
    queryKey: referralProgramKeys.me,
    queryFn: referralProgramApi.me,
    // A missing programme is a settled answer, not a transient failure worth hammering.
    retry: (failureCount, error) => !isProgrammeUnavailable(error) && failureCount < 2,
  });
}

export function useMyReferrals(page: number) {
  return useQuery({
    queryKey: referralProgramKeys.referrals(page),
    queryFn: () => referralProgramApi.referrals({ page, page_size: 10 }),
  });
}

export function useMyRewards({ redeemableOnly = false }: { redeemableOnly?: boolean } = {}) {
  return useQuery({
    queryKey: referralProgramKeys.rewards(redeemableOnly),
    queryFn: () => referralProgramApi.rewards(redeemableOnly ? { redeemable: "true" } : undefined),
  });
}

/** Rewards that can be spent right now, as the server judges it. */
export function useRedeemableRewards() {
  const query = useMyRewards({ redeemableOnly: true });
  const rewards: MyReferralReward[] = query.data?.results ?? [];
  return { ...query, rewards };
}

export function useRewardPreview() {
  return useMutation({ mutationFn: referralProgramApi.previewReward });
}

/**
 * Invalidate every referral surface. Called after a booking that spent a reward, a
 * cancellation that released one, and a successful payment that consumed one — in each case
 * the server has changed reward state and the cached view is stale.
 */
export function useInvalidateReferralProgram() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: referralProgramKeys.root });
  };
}
