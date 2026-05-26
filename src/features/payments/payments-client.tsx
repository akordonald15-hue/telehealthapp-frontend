"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { paymentsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { paymentSummary } from "@/lib/ui/humanize";
import type { Payment } from "@/lib/types/backend";
import { formatMoney } from "@/lib/utils";

export function PaymentsClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [retryError, setRetryError] = useState<string | null>(null);
  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentsApi.list(),
    enabled: userQuery.data?.role !== "doctor" && userQuery.data?.role !== "nurse",
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
        Caretekk does not support manual payment entry. To pay, book a doctor consultation or home nurse request and continue to the secure checkout created for that service.
      </Notice>
      {retryError ? (
        <Notice title="Payment could not be initialized." tone="warning">
          Your booking request was saved. Please try payment again. {retryError}
        </Notice>
      ) : null}

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
