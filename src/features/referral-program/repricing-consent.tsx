"use client";

import { Button } from "@/components/ui/button";
import type { PaymentInitiation } from "@/lib/types/backend";

import { PricingBreakdown } from "./reward-selector";

/**
 * A checkout can legitimately cost more than the last attempt: when a discounted payment fails,
 * the backend releases the reward and quotes the next attempt at full price.
 *
 * The patient must agree to the new amount before being sent to the payment provider. This
 * component is the gate — the caller must not redirect while it is showing.
 */
export function RepricingConsent({
  payment,
  serviceLabel,
  onContinue,
  onCancel,
}: {
  payment: PaymentInitiation;
  serviceLabel: string;
  onContinue: () => void;
  onCancel?: () => void;
}) {
  const money = (value?: string) => {
    if (!value) return "";
    const amount = Number(value);
    return Number.isNaN(amount) ? `₦${value}` : `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 0 })}`;
  };

  return (
    <div
      className="grid gap-3 rounded-[8px] border border-amber-200 bg-amber-50 p-4"
      role="alert"
      aria-live="polite"
    >
      <div>
        <p className="text-sm font-semibold text-amber-900">Your previous reward is no longer applied</p>
        <p className="mt-1 text-sm text-amber-800">
          The reward was released when the earlier payment did not go through. It is back in Refer &amp; Earn and you
          can use it on another booking.
        </p>
      </div>

      <dl className="grid gap-1 rounded-[6px] bg-white/70 p-3 text-sm">
        {payment.previous_amount ? (
          <div className="flex items-center justify-between">
            <dt className="text-slate-600">Previous amount</dt>
            <dd className="text-slate-500 line-through">{money(payment.previous_amount)}</dd>
          </div>
        ) : null}
        <div className="flex items-center justify-between">
          <dt className="font-semibold text-slate-900">New amount</dt>
          <dd className="text-base font-bold text-slate-900">{money(payment.amount)}</dd>
        </div>
      </dl>

      {payment.pricing ? <PricingBreakdown pricing={payment.pricing} serviceLabel={serviceLabel} /> : null}

      <div className="grid gap-2 sm:flex sm:items-center">
        <Button type="button" onClick={onContinue}>
          Continue to Payment
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Not now
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Does this response require explicit consent before we send the patient to the provider? */
export function requiresRepricingConsent(payment: PaymentInitiation | null | undefined) {
  return Boolean(payment?.repriced);
}
