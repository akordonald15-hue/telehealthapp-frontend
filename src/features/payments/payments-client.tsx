"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
    <Section
      title="Payments"
      description="Patients can initiate provider checkout. Admins can view all payments; doctors are not exposed to payment listing by the backend."
    >
      {userQuery.data?.role === "patient" ? (
        <form className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4" onSubmit={form.handleSubmit((values) => initiate.mutate(values))}>
          <ErrorMessage error={initiate.error} />
          {initiate.data?.authorization_url ? (
            <Notice title="Checkout ready" tone="success">
              <a className="font-semibold text-emerald-800" href={initiate.data.authorization_url}>
                Continue to {initiate.data.provider}
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
              <Input type="number" min={1} {...form.register("amount")} />
            </Field>
            <Field label="Currency" error={form.formState.errors.currency?.message}>
              <Input {...form.register("currency")} />
            </Field>
            <Field label="Appointment ID" error={form.formState.errors.appointment_id?.message?.toString()}>
              <Input type="number" min={1} {...form.register("appointment_id")} />
            </Field>
          </div>
          <Field label="Callback URL" error={form.formState.errors.callback_url?.message}>
            <Input {...form.register("callback_url")} />
          </Field>
          <Button className="w-fit" type="submit" disabled={initiate.isPending}>
            {initiate.isPending ? "Starting checkout..." : "Start checkout"}
          </Button>
        </form>
      ) : null}

      {userQuery.data?.role === "doctor" ? (
        <Notice title="Payments are not available for doctor accounts">
          The backend payment list only returns patient-owned records or admin records.
        </Notice>
      ) : (
        <DataList<Payment>
          data={payments.data}
          isLoading={payments.isLoading}
          empty="No payments returned."
          renderItem={(payment) => (
            <article key={payment.id} className="rounded-md border border-zinc-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-zinc-950">{formatMoney(payment.amount, payment.currency)}</p>
                  <p className="mt-1 text-sm text-zinc-600">
                    {payment.provider} · Patient #{payment.patient}
                  </p>
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
