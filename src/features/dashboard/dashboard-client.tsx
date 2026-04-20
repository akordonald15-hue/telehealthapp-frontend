"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentsApi, messagingApi, paymentsApi, referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import type { PaginatedResponse } from "@/lib/types/backend";
import { formatDateTime, formatMoney } from "@/lib/utils";

function Metric({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300">
      <span className="text-sm text-zinc-500">{label}</span>
      <strong className="mt-2 block text-2xl font-semibold text-zinc-950">{value}</strong>
    </Link>
  );
}

type ListQuery<T> = {
  data?: PaginatedResponse<T>;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed.";
}

function listMetric<T>(query: ListQuery<T>) {
  if (query.isLoading) {
    return "...";
  }
  if (query.isError) {
    return "Error";
  }
  return query.data?.count ?? query.data?.results.length ?? 0;
}

export function DashboardClient() {
  const userQuery = useCurrentUser();
  const appointments = useQuery({ queryKey: ["appointments", "dashboard"], queryFn: () => appointmentsApi.list({ page_size: 5 }) });
  const threads = useQuery({ queryKey: ["threads", "dashboard"], queryFn: () => messagingApi.threads({ page_size: 5 }) });
  const canLoadPayments = userQuery.data ? userQuery.data.role !== "doctor" : false;
  const payments = useQuery({
    queryKey: ["payments", "dashboard"],
    queryFn: () => paymentsApi.list({ page_size: 5 }),
    enabled: canLoadPayments,
  });
  const referrals = useQuery({ queryKey: ["referrals", "dashboard"], queryFn: () => referralsApi.list({ page_size: 5 }) });

  const user = userQuery.data;
  const paymentMetric = user?.role === "doctor" ? "Doctor role" : listMetric(payments);
  const dashboardErrors = [
    appointments.isError ? `Appointments: ${errorMessage(appointments.error)}` : null,
    threads.isError ? `Messages: ${errorMessage(threads.error)}` : null,
    referrals.isError ? `Referrals: ${errorMessage(referrals.error)}` : null,
    payments.isError ? `Payments: ${errorMessage(payments.error)}` : null,
  ].filter(Boolean);

  return (
    <Section
      title="Dashboard"
      description="Your workspace reflects the backend role and ownership rules for the signed-in account."
    >
      {dashboardErrors.length ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {dashboardErrors.join(" ")}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Appointments" value={listMetric(appointments)} href="/appointments" />
        <Metric label="Message threads" value={listMetric(threads)} href="/messages" />
        <Metric label="Referrals" value={listMetric(referrals)} href="/referrals" />
        <Metric label="Payments" value={paymentMetric} href="/payments" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-950">Next appointments</h2>
            {user ? <Badge>{user.role}</Badge> : null}
          </div>
          <div className="grid gap-3">
            {appointments.isLoading ? (
              <p className="text-sm text-zinc-600">Loading appointments...</p>
            ) : appointments.isError ? (
              <p className="text-sm text-red-700">{errorMessage(appointments.error)}</p>
            ) : appointments.data?.results.length ? (
              appointments.data.results.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-stone-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-950">{formatDateTime(item.scheduled_at)}</p>
                    <p className="text-xs text-zinc-500">Doctor #{item.doctor}</p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600">No appointments returned.</p>
            )}
          </div>
        </div>
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-zinc-950">Recent payments</h2>
            <Link className="text-sm font-semibold text-emerald-800" href="/payments">
              Open
            </Link>
          </div>
          <div className="grid gap-3">
            {user?.role === "doctor" ? (
              <p className="text-sm text-zinc-600">Payment listing is not exposed for doctors.</p>
            ) : userQuery.isLoading || payments.isLoading ? (
              <p className="text-sm text-zinc-600">Loading payments...</p>
            ) : payments.isError ? (
              <p className="text-sm text-red-700">{errorMessage(payments.error)}</p>
            ) : payments.data?.results.length ? (
              payments.data.results.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-md bg-stone-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-950">{formatMoney(item.amount, item.currency)}</p>
                    <p className="text-xs text-zinc-500">{item.provider}</p>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600">No payments returned.</p>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
