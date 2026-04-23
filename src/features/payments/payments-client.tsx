"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CreditCardIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { paymentsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { paymentSummary } from "@/lib/ui/humanize";
import type { Payment } from "@/lib/types/backend";
import { formatMoney } from "@/lib/utils";
import { paymentInitiateSchema } from "@/lib/validation/features";

type PaymentFormValues = z.input<typeof paymentInitiateSchema>;
type PaymentInput = z.output<typeof paymentInitiateSchema>;

export function PaymentsClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const payments = useQuery({
    queryKey: ["payments"],
    queryFn: () => paymentsApi.list(),
    enabled: userQuery.data?.role !== "doctor",
  });
  const initiate = useMutation({
    mutationFn: (values: PaymentInput) =>
      paymentsApi.initiate({
        provider: values.provider,
        amount: values.amount,
        currency: values.currency,
        appointment_id: values.appointment_id === "" ? undefined : values.appointment_id,
        callback_url: values.callback_url,
      }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });
  const form = useForm<PaymentFormValues, unknown, PaymentInput>({
    resolver: zodResolver(paymentInitiateSchema),
    defaultValues: {
      provider: "paystack",
      amount: 0,
      currency: "NGN",
      appointment_id: "",
      callback_url: typeof window !== "undefined" ? `${window.location.origin}/payments` : "",
    },
  });

  return (
    <Section title="Payments" description="Review your payment history and complete checkout when needed.">
      {userQuery.data?.role === "patient" ? (
        <form className="grid gap-4 rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6" onSubmit={form.handleSubmit((values) => initiate.mutate(values))}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
              <CreditCardIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-[#1F2937]">Start a checkout</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Start a secure checkout for your visit and continue when you&apos;re ready.</p>
            </div>
          </div>
          <ErrorMessage error={initiate.error} context="paymentCheckout" />
          {initiate.data?.authorization_url ? (
            <Notice title="Checkout ready" tone="success">
              <a className="font-semibold text-[#2563EB]" href={initiate.data.authorization_url}>
                Continue to payment
              </a>
            </Notice>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Provider" error={form.formState.errors.provider?.message}>
              <Select {...form.register("provider")}>
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
              </Select>
            </Field>
            <Field label="Amount" error={form.formState.errors.amount?.message}>
              <Input type="number" min={1} placeholder="5000" {...form.register("amount")} />
            </Field>
            <Field label="Currency" error={form.formState.errors.currency?.message}>
              <Input placeholder="NGN" {...form.register("currency")} />
            </Field>
            <Field label="Appointment number" error={form.formState.errors.appointment_id?.message?.toString()} hint="Optional if this payment is tied to a visit.">
              <Input type="number" min={1} placeholder="Enter the visit number if you have it" {...form.register("appointment_id")} />
            </Field>
          </div>
          <Field label="Callback URL" error={form.formState.errors.callback_url?.message}>
            <Input {...form.register("callback_url")} />
          </Field>
          <Button className="w-full sm:w-fit" type="submit" disabled={initiate.isPending}>
            {initiate.isPending ? "Starting checkout..." : "Start checkout"}
          </Button>
        </form>
      ) : null}

      {userQuery.data?.role === "doctor" ? (
        <Notice title="Payments are hidden for doctor accounts" tone="neutral">
          Payment history is only shown where it is needed.
        </Notice>
      ) : (
        <DataList<Payment>
          data={payments.data}
          isLoading={payments.isLoading}
          error={payments.error}
          errorContext="payments"
          loadingLabel="Loading your payment history..."
          emptyTitle="No payments yet"
          empty="Your payment history will appear here when you have activity to review."
          renderItem={(payment) => (
            <article key={payment.id} className="rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.45)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">{formatMoney(payment.amount, payment.currency)}</p>
                  <p className="mt-2 text-sm text-slate-600">{paymentSummary(payment.provider, userQuery.data?.role)}</p>
                </div>
                <StatusBadge value={payment.status} />
              </div>
            </article>
          )}
        />
      )}
    </Section>
  );
}
