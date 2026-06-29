"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Landmark, UploadCloud } from "lucide-react";

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
  onSubmit: (proofFile: File) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofError, setProofError] = useState("");
  const details = payment.bank_transfer;
  if (!details) {
    return null;
  }
  const amountLabel = formatMoney(payment.amount, payment.currency);
  const awaitingVerification = submitted || payment.status === "awaiting_manual_verification";
  const proofUploaded = Boolean(payment.transfer_proof_uploaded);
  const proofReady = Boolean(proofFile || proofUploaded);

  function handleProofFile(file: File | null) {
    setProofError("");
    if (!file) {
      setProofFile(null);
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setProofFile(null);
      setProofError("Upload a JPG, PNG, WebP, or PDF payment proof.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofFile(null);
      setProofError("Payment proof must be 5 MB or smaller.");
      return;
    }
    setProofFile(file);
  }

  return (
    <div className="grid gap-4 rounded-[8px] border border-[#DBEAFE] bg-[#F8FBFF] p-4">
      <Notice title="Bank transfer payment" tone="warning">
        Complete payment by bank transfer. Caretekk will open the service after your transfer is verified.
      </Notice>

      <div className="rounded-[8px] border border-white bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#DBEAFE] text-[#2563EB]">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#1F2937]">Bank transfer selected</p>
              <p className="mt-1 text-sm text-slate-600">{amountLabel}</p>
              <p className="mt-1 break-words text-xs text-slate-500">Reference: {payment.external_ref || details.reference}</p>
            </div>
          </div>
          <Button type="button" variant="secondary" className="w-full sm:w-fit" onClick={() => setDetailsOpen(true)}>
            View bank details
          </Button>
        </div>
      </div>

      {awaitingVerification ? (
        <Notice title="Awaiting Payment Verification" tone="warning">
          We have received your payment proof. Our team is verifying your transfer. This usually takes only a few minutes during working hours.
        </Notice>
      ) : (
        <div className="grid gap-3 rounded-[8px] border border-dashed border-[#BFDBFE] bg-white p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#EFF6FF] text-[#2563EB]">
              <UploadCloud className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1F2937]">Upload payment proof</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Add a transfer screenshot, receipt image, or PDF so admin can verify your payment.
              </p>
            </div>
          </div>
          <label className="grid cursor-pointer gap-2 rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-100">
            <span className="font-semibold text-[#1F2937]">{proofFile ? "Change payment proof" : "Choose payment proof"}</span>
            <span className="break-words text-xs text-slate-500">
              {proofFile ? proofFile.name : "JPG, PNG, WebP, or PDF. Maximum 5 MB."}
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="sr-only"
              onChange={(event) => handleProofFile(event.target.files?.[0] ?? null)}
            />
          </label>
          {proofError ? <p className="text-sm font-semibold text-amber-700">{proofError}</p> : null}
          <Button
            type="button"
            className="w-full sm:w-fit"
            disabled={isSubmitting || !proofReady}
            onClick={() => {
              if (!proofFile) {
                setProofError("Please upload your payment proof before submitting.");
                return;
              }
              setConfirmOpen(true);
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Payment Proof"}
          </Button>
        </div>
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
                  Only continue after you have completed the bank transfer and attached the correct receipt. Caretekk will verify it before the service opens.
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
                  if (proofFile) {
                    onSubmit(proofFile);
                  }
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {detailsOpen ? (
        <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto bg-slate-950/40 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-[8px] bg-white p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#DBEAFE] text-[#2563EB]">
                <Landmark className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-heading text-xl font-semibold text-[#1F2937]">Transfer to Caretekk</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use the details below, then return here to notify Caretekk after payment.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm">
              <PaymentLine label="Bank name" value={details.bank_name} />
              <PaymentLine label="Account name" value={details.account_name} />
              <PaymentLine label="Account number" value={details.account_number} copyValue={details.account_number} copyLabel="Copy account" />
              <PaymentLine label="Amount to pay" value={amountLabel} copyValue={payment.amount} copyLabel="Copy amount" />
              <PaymentLine label="Payment reference" value={payment.external_ref || details.reference} copyValue={payment.external_ref || details.reference} copyLabel="Copy reference" />
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {details.instructions || "Please include this reference as your transfer narration whenever possible."}
            </p>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setDetailsOpen(false)}>
                Close
              </Button>
              {!awaitingVerification ? (
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setDetailsOpen(false);
                    setConfirmOpen(true);
                  }}
                >
                  {isSubmitting ? "Submitting..." : "I Have Made Payment"}
                </Button>
              ) : null}
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
