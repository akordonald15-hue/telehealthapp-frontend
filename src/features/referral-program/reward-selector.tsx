"use client";

import { useEffect } from "react";
import { Ticket } from "lucide-react";

import { InlineLoader } from "@/components/ui/loaders";
import type { CheckoutPricing, MyReferralReward } from "@/lib/types/backend";

import { formatReferralDate } from "./format";
import { isProgrammeUnavailable, useRedeemableRewards, useRewardPreview } from "./use-referral-program";

/**
 * Lets a patient apply one earned reward to the booking they are about to make.
 *
 * It sends nothing but the reward's public id. Every figure shown here comes from the server —
 * either the reward's own snapshot or a booking/preview response — because the backend is the
 * only thing allowed to price a checkout.
 */
export function RewardSelector({
  serviceType,
  selectedRewardId,
  onSelect,
  disabled = false,
  serviceId,
  serviceLabel = "Service",
}: {
  serviceType: "appointment" | "homecare";
  selectedRewardId: string | null;
  onSelect: (publicId: string | null) => void;
  disabled?: boolean;
  /** Home care only: which service, so the server prices the right one. */
  serviceId?: number;
  serviceLabel?: string;
}) {
  const { rewards, isPending, error } = useRedeemableRewards();
  const preview = useRewardPreview();
  const previewMutate = preview.mutate;

  // Non-binding: this is an explanation of the price, never an authorization. The booking
  // request still sends reward_id and the backend recalculates under a lock.
  useEffect(() => {
    if (!selectedRewardId) {
      return;
    }
    previewMutate({ publicId: selectedRewardId, serviceType, ...(serviceId ? { service: serviceId } : {}) });
  }, [previewMutate, selectedRewardId, serviceId, serviceType]);

  // A reward that no longer appears (spent elsewhere, expired) must not stay selected.
  useEffect(() => {
    if (selectedRewardId && !rewards.some((reward) => reward.public_id === selectedRewardId)) {
      onSelect(null);
    }
  }, [onSelect, rewards, selectedRewardId]);

  if (isProgrammeUnavailable(error)) {
    return null; // Promotional surfaces stay hidden when the programme is off.
  }
  if (isPending) {
    return <InlineLoader label="Checking your rewards" />;
  }

  const eligible = rewards.filter(
    (reward) => !reward.applicable_services.length || reward.applicable_services.includes(serviceType),
  );

  if (!eligible.length) {
    return null; // Nothing to offer: no banner, no dead control.
  }

  return (
    <fieldset className="ct-surface grid gap-2 rounded-[8px] p-4" disabled={disabled}>
      <legend className="flex items-center gap-2 px-1 text-sm font-semibold text-slate-900">
        <Ticket className="h-4 w-4 text-[var(--primary)]" aria-hidden />
        Apply a reward
      </legend>
      <div className="grid gap-2">
        {eligible.map((reward) => (
          <label
            key={reward.public_id}
            className="flex min-h-11 cursor-pointer items-start gap-3 rounded-[8px] border border-slate-200 p-3 transition hover:bg-slate-50 has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary-soft)]"
          >
            <input
              type="radio"
              name="referral-reward"
              className="mt-1 h-4 w-4"
              value={reward.public_id}
              checked={selectedRewardId === reward.public_id}
              onChange={() => onSelect(reward.public_id)}
            />
            <span className="grid gap-0.5">
              <span className="text-sm font-semibold text-slate-900">{rewardLabel(reward)}</span>
              <span className="text-xs text-slate-500">Expires {formatReferralDate(reward.expires_at)}</span>
            </span>
          </label>
        ))}
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-[8px] border border-slate-200 p-3 transition hover:bg-slate-50 has-[:checked]:border-[var(--primary)] has-[:checked]:bg-[var(--primary-soft)]">
          <input
            type="radio"
            name="referral-reward"
            className="h-4 w-4"
            value=""
            checked={selectedRewardId === null}
            onChange={() => onSelect(null)}
          />
          <span className="text-sm text-slate-700">Don&apos;t use a reward</span>
        </label>
      </div>

      {selectedRewardId && preview.isPending ? <InlineLoader label="Checking your price" /> : null}
      {selectedRewardId && preview.data ? (
        <>
          <PricingBreakdown pricing={preview.data} serviceLabel={serviceLabel} />
          <p className="text-[11px] text-slate-500">
            Final price is confirmed when you continue to payment.
          </p>
        </>
      ) : null}
      {selectedRewardId && preview.isError ? (
        <p className="text-sm text-amber-700" role="status">
          This reward can&apos;t be previewed right now. You can still continue, or choose another reward.
        </p>
      ) : null}
    </fieldset>
  );
}

function rewardLabel(reward: MyReferralReward) {
  const value = reward.reward_value.replace(/\.00$/, "");
  const headline = reward.reward_type === "percent" ? `${value}% off` : `₦${value} off`;
  if (!reward.max_reward_amount) {
    return headline;
  }
  const cap = Number(reward.max_reward_amount);
  const capLabel = Number.isNaN(cap) ? reward.max_reward_amount : cap.toLocaleString("en-NG", { maximumFractionDigits: 0 });
  return `${headline} · Up to ₦${capLabel}`;
}

/**
 * The server's price breakdown for a checkout. Rendered exactly as returned — no percentage is
 * recalculated here, so what the patient sees is what the payment will charge.
 */
export function PricingBreakdown({
  pricing,
  serviceLabel,
}: {
  pricing: CheckoutPricing;
  serviceLabel: string;
}) {
  const money = (value: string) => {
    const amount = Number(value);
    return Number.isNaN(amount) ? `₦${value}` : `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  };

  return (
    <dl className="grid gap-1.5 rounded-[8px] bg-slate-50 p-4 text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-slate-600">{serviceLabel}</dt>
        <dd className="font-medium text-slate-900">{money(pricing.service_value)}</dd>
      </div>
      {pricing.reward_applied ? (
        <div className="flex items-center justify-between">
          <dt className="text-emerald-700">Referral reward</dt>
          <dd className="font-medium text-emerald-700">-{money(pricing.discount)}</dd>
        </div>
      ) : null}
      <div className="mt-1 flex items-center justify-between border-t border-slate-200 pt-2">
        <dt className="font-semibold text-slate-900">Amount due</dt>
        <dd className="text-base font-bold text-slate-900">{money(pricing.amount_due)}</dd>
      </div>
    </dl>
  );
}
