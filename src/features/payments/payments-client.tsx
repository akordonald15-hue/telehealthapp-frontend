"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { paymentsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { paymentSummary } from "@/lib/ui/humanize";
import type { Payment } from "@/lib/types/backend";
import { formatMoney } from "@/lib/utils";

const MANUAL_PAYMENT_WAITING_STATUSES = new Set(["awaiting_transfer", "transfer_submitted", "awaiting_manual_verification"]);

export function PaymentsClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [retryError, setRetryError] = useState<string | null>(null);
  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentsApi.list(),
    enabled: userQuery.data?.role !== "doctor" && userQuery.data?.role !== "nurse",
    refetchInterval: (query) => {
      const items = query.state.data?.results ?? [];
      return items.some((payment) => payment.provider === "bank_transfer" && MANUAL_PAYMENT_WAITING_STATUSES.has(payment.status)) ? 12000 : false;
    },
  });
  const retryPayment = useMutation({
    mutationFn: paymentsApi.retry,
    onMutate: () => setRetryError(null),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["payments"] });
      if (result.authorization_url && typeof window !== "undefined") {
        window.location.href = result.authorization_url;
      }
    },
    onError: (error) => {
      setRetryError(getFriendlyErrorMessage(error, "payments"));
    },
  });

  const canRetryPayment = (payment: Payment) =>
    payment.status !== "success" && (payment.appointment !== null || payment.homecare_request !== null);

  return (
    <Section
      title="Billing History"
      description="Read-only checkout history for booked Caretekk services. Payments start only from consultation or homecare booking."
    >
      <Notice title="Service payments only" tone="neutral">
        To pay, book a doctor consultation or home nurse request and follow the payment instructions created for that service.
      </Notice>
      {retryError ? (
        <Notice title="Payment could not be initialized." tone="warning">
          Your booking request was saved. Please try payment again. {retryError}
        </Notice>
      ) : null}
      {retryPayment.isPending ? <InlineLoader label="Preparing secure payment" /> : null}

      {userQuery.data?.role === "doctor" || userQuery.data?.role === "nurse" ? (
        <Notice title="Billing history is not available for this account." tone="neutral">
          Provider earnings are shown on your dashboard wallet, not here.
        </Notice>
      ) : (
        <DataList<Payment>
          data={payments.data}
          isLoading={payments.isLoading}
          error={payments.error}
          errorContext="payments"
          loadingLabel="Loading your billing history..."
          emptyTitle="No billing history yet"
          empty="Checkout records will appear here after you book a doctor consultation or home nurse request."
          renderItem={(payment) => (
            <article key={payment.id} className="ct-surface rounded-[24px] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">{formatMoney(payment.amount, payment.currency)}</p>
                  <p className="mt-2 text-sm text-slate-600">{paymentSummary(payment.provider, userQuery.data?.role)}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {payment.appointment
                      ? `Consultation #${payment.appointment}`
                      : payment.homecare_request
                        ? `Homecare request #${payment.homecare_request}`
                        : "Service checkout"}
                  </p>
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <StatusBadge value={payment.status} />
                  {payment.provider === "bank_transfer" && payment.status === "awaiting_manual_verification" ? (
                    <p className="max-w-xs text-left text-xs leading-5 text-slate-500 sm:text-right">
                      Your payment notification has been received. We&apos;re verifying your transfer.
                    </p>
                  ) : payment.provider === "bank_transfer" && payment.status === "success" ? (
                    <p className="max-w-xs text-left text-xs font-semibold leading-5 text-emerald-700 sm:text-right">
                      Payment confirmed. Your consultation is now active.
                    </p>
                  ) : payment.provider === "bank_transfer" && payment.status === "rejected" ? (
                    <p className="max-w-xs text-left text-xs leading-5 text-rose-700 sm:text-right">
                      We could not verify your payment. Please contact Caretekk support or resubmit your payment confirmation.
                    </p>
                  ) : null}
                  {canRetryPayment(payment) ? (
                    <Button
                      variant="secondary"
                      onClick={() => retryPayment.mutate(payment.id)}
                      disabled={retryPayment.isPending}
                      className="gap-2"
                    >
                      {retryPayment.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      Retry payment
                    </Button>
                  ) : null}
                </div>
              </div>
            </article>
          )}
        />
      )}
    </Section>
  );
}
