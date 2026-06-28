"use client";

import { useState } from "react";
import { CheckCircle2, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import type { PaymentInitiation } from "@/lib/types/backend";
import { formatMoney } from "@/lib/utils";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[8px] border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      <Copy className="h-3.5 w-3.5" />
      {copied ? "Copied" : label}
    </button>
  );
}

export function BankTransferPaymentPanel({
  payment,
  isSubmitting,
  submitted,
  error,
  onSubmit,
}: {
  payment: PaymentInitiation;
  isSubmitting: boolean;
  submitted: boolean;
  error?: string | null;
  onSubmit: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const details = payment.bank_transfer;
  if (!details) {
    return null;
  }
  const amountLabel = formatMoney(payment.amount, payment.currency);
  const awaitingVerification = submitted || payment.status === "awaiting_manual_verification";

  return (
    <div className="grid gap-4 rounded-[8px] border border-[#DBEAFE] bg-[#F8FBFF] p-4">
      <Notice title="Bank transfer payment" tone="warning">
        Online card payments are temporarily unavailable while our payment gateway is being updated. Please complete payment via bank transfer. Your consultation will begin immediately after your payment has been verified.
      </Notice>

      <div className="grid gap-3 text-sm">
        <PaymentLine label="Amount to pay" value={amountLabel} copyValue={payment.amount} copyLabel="Copy amount" />
        <PaymentLine label="Bank name" value={details.bank_name} />
        <PaymentLine label="Account name" value={details.account_name} />
        <PaymentLine label="Account number" value={details.account_number} copyValue={details.account_number} copyLabel="Copy account" />
        <PaymentLine label="Payment reference" value={payment.external_ref || details.reference} copyValue={payment.external_ref || details.reference} copyLabel="Copy reference" />
      </div>

      <p className="text-sm leading-6 text-slate-600">
        {details.instructions || "Please include this reference as your transfer narration whenever possible."}
      </p>

      {awaitingVerification ? (
        <Notice title="Awaiting Payment Verification" tone="warning">
          We have received your payment notification. Our team is verifying your transfer. This usually takes only a few minutes during working hours.
        </Notice>
      ) : (
        <Button type="button" className="w-full sm:w-fit" disabled={isSubmitting} onClick={() => setConfirmOpen(true)}>
          {isSubmitting ? "Submitting..." : "I Have Made Payment"}
        </Button>
      )}

      {error ? (
        <Notice title="Payment notification was not submitted." tone="warning">
          {error}
        </Notice>
      ) : null}

      {confirmOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-[8px] bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-heading text-xl font-semibold text-[#1F2937]">Confirm payment notification?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Only continue after you have completed the bank transfer. Caretekk will verify the bank alert before the consultation opens.
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  onSubmit();
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PaymentLine({ label, value, copyValue, copyLabel }: { label: string; value: string; copyValue?: string; copyLabel?: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-[8px] border border-white bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-0 text-slate-500">{label}</p>
        <p className="mt-1 break-words text-base font-semibold text-[#1F2937]">{value}</p>
      </div>
      {copyValue ? <CopyButton value={copyValue} label={copyLabel || "Copy"} /> : null}
    </div>
  );
}
