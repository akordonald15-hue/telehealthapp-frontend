"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, ClipboardList, CreditCard, FileText, MessageSquareText, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { InlineLoader } from "@/components/ui/loaders";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentsApi, messagingApi, paymentsApi, profilesApi, referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { appointmentCompanionLabel, paymentSummary } from "@/lib/ui/humanize";
import type { PaginatedResponse, PatientProfile } from "@/lib/types/backend";
import { formatDateTime, formatMoney } from "@/lib/utils";
import { DoctorDashboardClient } from "@/features/dashboard/doctor-dashboard-client";
import { NurseDashboardClient } from "@/features/nurse/nurse-dashboard-client";
import { AdminDashboardClient } from "@/features/admin/admin-dashboard-client";

function Metric({ label, value, href, icon: Icon, description }: { label: string; value: string | number; href: string; icon: React.ComponentType<{ className?: string }>; description: string }) {
  return (
    <Link
      href={href}
      className="ct-hover-lift ct-surface group rounded-[8px] p-4 hover:shadow-[0_24px_56px_-38px_rgba(37,99,235,0.18)]"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#DBEAFE] text-[#2563EB]">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <span className="mt-4 block text-sm font-semibold text-slate-500">{label}</span>
      <strong className="mt-1 block font-heading text-[1.65rem] font-semibold tracking-tight text-[#1F2937]">{value}</strong>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]">
        Open
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

type ListQuery<T> = {
  data?: PaginatedResponse<T>;
  error: unknown;
  isError: boolean;
  isLoading: boolean;
};

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
  const user = userQuery.data;
  const isNurse = user?.role === "nurse";
  const [assistantWelcomeOpen, setAssistantWelcomeOpen] = useState(false);

  const appointments = useQuery({
    queryKey: ["appointments", "dashboard"],
    queryFn: () => appointmentsApi.list({ page_size: 5 }),
    enabled: !isNurse,
  });
  const threads = useQuery({
    queryKey: ["threads", "dashboard"],
    queryFn: () => messagingApi.threads({ page_size: 5 }),
    enabled: !isNurse,
  });
  const canLoadPayments = user?.role === "admin";
  const payments = useQuery({
    queryKey: ["payments", "dashboard"],
    queryFn: () => paymentsApi.list({ page_size: 5 }),
    enabled: canLoadPayments,
  });
  const referrals = useQuery({
    queryKey: ["referrals", "dashboard"],
    queryFn: () => referralsApi.list({ page_size: 5 }),
    enabled: !isNurse,
  });
  const carePlans = useQuery({
    queryKey: ["care-plans", "dashboard"],
    queryFn: () => profilesApi.carePlans({ page_size: 5 }),
    enabled: user?.role === "patient",
  });
  const patientProfile = useQuery({
    queryKey: ["profile", "me", "patient"],
    queryFn: () => profilesApi.me<PatientProfile>(),
    enabled: user?.role === "patient",
  });

  useEffect(() => {
    if (typeof window === "undefined" || user?.role !== "patient" || !patientProfile.data?.profile_complete) {
      return;
    }
    const key = `caretekk:assistant-welcome-shown:${user.id}`;
    if (window.localStorage.getItem(key)) {
      return;
    }
    window.localStorage.setItem(key, "1");
    const timer = window.setTimeout(() => setAssistantWelcomeOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [patientProfile.data?.profile_complete, user?.id, user?.role]);

  if (isNurse) {
    return <NurseDashboardClient />;
  }

  if (user?.role === "doctor") {
    return <DoctorDashboardClient />;
  }

  if (user?.role === "admin") {
    return <AdminDashboardClient />;
  }

  const threadMetric = listMetric(threads);
  const referralMetric = listMetric(referrals);
  const carePlanMetric = listMetric(carePlans);
  const paymentMetric = canLoadPayments ? listMetric(payments) : 0;
  const patientHasConsultation = typeof threadMetric === "number" && threadMetric > 0;
  const patientHasCarePlan = typeof carePlanMetric === "number" && carePlanMetric > 0;
  const patientHasReferral = typeof referralMetric === "number" && referralMetric > 0;
  const nextPatientStep = patientHasConsultation
    ? {
        title: "Guided Journey",
        description: "Your consultation is ready.",
        href: "/messages",
        cta: "Open Consultation",
      }
    : {
        title: "Guided Journey",
        description: "Start with the Caretekk Assistant.",
        href: "/appointments",
        cta: "Book Doctor",
      };
  const dashboardErrors = [
    appointments.isError ? `Appointments: ${getFriendlyErrorMessage(appointments.error, "dashboard")}` : null,
    threads.isError ? `Messages: ${getFriendlyErrorMessage(threads.error, "dashboard")}` : null,
    referrals.isError ? `Referrals: ${getFriendlyErrorMessage(referrals.error, "dashboard")}` : null,
    carePlans.isError ? `Care plans: ${getFriendlyErrorMessage(carePlans.error, "dashboard")}` : null,
    payments.isError ? `Payments: ${getFriendlyErrorMessage(payments.error, "dashboard")}` : null,
  ].filter(Boolean);

  return (
    <Section
      title={user?.role === "patient" ? "Your Care Journey" : "Dashboard"}
      description={
        user?.role === "patient"
          ? ""
          : "A simple view of your appointments, conversations, billing history, and next steps."
      }
    >
      {user?.role === "patient" ? (
        <>
          <Modal
            open={assistantWelcomeOpen}
            title="Caretekk Health Assistant"
            description="A guided start for every doctor consultation."
            onClose={() => setAssistantWelcomeOpen(false)}
            size="lg"
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setAssistantWelcomeOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700"
                >
                  Not now
                </button>
                <Link
                  href="/appointments"
                  onClick={() => setAssistantWelcomeOpen(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[#0F766E] px-5 text-sm font-semibold text-white"
                >
                  Start with AI Assistant
                </Link>
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[8px] bg-emerald-50 text-[#0F766E]">
                <Sparkles className="h-10 w-10" />
              </div>
              <div>
                <p className="font-heading text-2xl font-semibold leading-tight text-[#1F2937]">
                  Hi. I&apos;m your Caretekk Health Assistant.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  I&apos;ll ask a few questions so I can understand how you&apos;re feeling and recommend the most appropriate doctor.
                </p>
              </div>
            </div>
          </Modal>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[8px] border border-white/70 bg-[linear-gradient(135deg,#2563EB_0%,#3B82F6_55%,#60A5FA_100%)] p-5 text-white shadow-[0_24px_64px_-42px_rgba(37,99,235,0.42)]">
              <p className="ct-caption text-blue-100">Guided Journey</p>
              <h2 className="mt-3 font-heading text-xl font-semibold text-white">{nextPatientStep.description}</h2>
            </div>
            <Link href="/appointments" className="ct-surface rounded-[8px] p-4">
              <p className="ct-caption text-[var(--primary)]">Book Doctor</p>
              <p className="mt-3 text-sm font-semibold text-[#1F2937]">Start with AI Assistant</p>
            </Link>
            <Link href={patientHasConsultation ? "/messages" : "/appointments"} className="ct-surface rounded-[8px] p-4">
              <p className="ct-caption text-[var(--primary)]">Next Step</p>
              <p className="mt-3 text-sm font-semibold text-[#1F2937]">{patientHasConsultation ? "Open consultation" : "Review appointments"}</p>
            </Link>
          </div>

          {dashboardErrors.length ? (
            <Notice title="We're having trouble loading some parts of your journey." tone="warning">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>Some details may be missing for a moment. Please try again.</span>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
                >
                  Try again
                </button>
              </div>
            </Notice>
          ) : null}

          {patientProfile.data && !patientProfile.data.profile_complete ? (
            <Notice title="Complete your profile before booking" tone="warning">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>Doctors need your name, phone, date of birth, gender, state, and LGA before consultation.</span>
                <Link
                  href="/profile"
                  className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-white px-4 text-sm font-semibold text-amber-800"
                >
                  Complete profile
                </Link>
              </div>
            </Notice>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <div className="ct-surface rounded-[8px] p-4">
              <p className="text-sm font-semibold text-slate-500">AI Assistant</p>
              <p className="mt-2 font-heading text-xl font-semibold text-[#1F2937]">{patientHasConsultation ? "Done" : "Next"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Share symptoms as part of booking.</p>
              <Link href="/appointments" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]">Start <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="ct-surface rounded-[8px] p-4">
              <p className="text-sm font-semibold text-slate-500">Consultation</p>
              <p className="mt-2 font-heading text-xl font-semibold text-[#1F2937]">{patientHasConsultation ? "Ready" : "Waiting"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Continue with your doctor.</p>
              <Link href="/messages" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]">Open <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="ct-surface rounded-[8px] p-4">
              <p className="text-sm font-semibold text-slate-500">Care plan</p>
              <p className="mt-2 font-heading text-xl font-semibold text-[#1F2937]">{patientHasCarePlan ? "Available" : "Coming next"}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Review care updates.</p>
              <Link href="/care-plan" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#2563EB]">Open <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Appointments" value={listMetric(appointments)} href="/appointments" icon={CalendarClock} description="Visits and booking details." />
            <Metric label="Consultations" value={threadMetric} href="/messages" icon={MessageSquareText} description="Doctor conversations." />
            <Metric label="Care Plans" value={carePlanMetric} href="/care-plan" icon={FileText} description="Doctor-written next steps." />
            {patientHasReferral ? <Metric label="Referrals" value={referralMetric} href="/referrals" icon={ClipboardList} description="Specialist referrals." /> : null}
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <div className="rounded-[8px] border border-white/70 bg-[linear-gradient(135deg,#2563EB_0%,#3B82F6_45%,#60A5FA_100%)] p-6 text-white shadow-[0_30px_80px_-40px_rgba(37,99,235,0.48)] sm:p-8">
              <p className="ct-caption text-blue-100">Caretekk workspace</p>
              <h2 className="ct-dashboard-title mt-4 text-white">Care updates at a glance.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-blue-50/90">
                Visits, conversations, records, and referrals in one place.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/appointments" className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-white px-5 text-sm font-semibold text-[#2563EB] shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5">
                  Book or review visits
                </Link>
                <Link href="/messages" className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/16">
                  Open messages
                </Link>
              </div>
            </div>

            <div className="ct-panel rounded-[8px] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-emerald-50 text-[#10B981]">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="ct-card-title text-[#1F2937]">Today at a glance</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">What needs attention next.</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3 text-sm text-slate-600">
                <div className="ct-soft-panel rounded-[8px] px-4 py-3">
                  <p className="font-semibold text-[#1F2937]">Appointments</p>
                  <p className="mt-1 leading-6">{appointments.isLoading ? "Loading your upcoming visits..." : `${listMetric(appointments)} appointment${listMetric(appointments) === 1 ? "" : "s"} to review.`}</p>
                </div>
                <div className="ct-soft-panel rounded-[8px] px-4 py-3">
                  <p className="font-semibold text-[#1F2937]">Messages</p>
                  <p className="mt-1 leading-6">{threads.isLoading ? "Loading your conversations..." : `${listMetric(threads)} conversation${listMetric(threads) === 1 ? "" : "s"} available.`}</p>
                </div>
                <div className="ct-soft-panel rounded-[8px] px-4 py-3">
                  <p className="font-semibold text-[#1F2937]">Billing history</p>
                  <p className="mt-1 leading-6">{`${paymentMetric} payment update${paymentMetric === 1 ? "" : "s"} available.`}</p>
                </div>
              </div>
            </div>
          </div>

          {dashboardErrors.length ? (
            <Notice title="We're having trouble loading some parts of your dashboard." tone="warning">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>Some details may be missing for a moment. Please try again.</span>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
                >
                  Try again
                </button>
              </div>
            </Notice>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Appointments" value={listMetric(appointments)} href="/appointments" icon={CalendarClock} description="Upcoming visits." />
            <Metric label="Conversations" value={listMetric(threads)} href="/messages" icon={MessageSquareText} description="Care conversations." />
            <Metric label="Referrals" value={listMetric(referrals)} href="/referrals" icon={FileText} description="Referral activity." />
            <Metric label="Billing History" value={paymentMetric} href="/payments" icon={CreditCard} description="Checkout activity." />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="ct-panel rounded-[8px] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="ct-card-title text-[#1F2937]">Next appointments</h2>
                  <p className="mt-1 text-sm text-slate-500">Your upcoming visits at a glance.</p>
                </div>
                {user ? <span className="text-sm font-medium text-slate-500">{user.email}</span> : null}
              </div>
              <div className="grid gap-3">
                {appointments.isLoading ? (
                  <InlineLoader compact label="Loading your care dashboard" />
                ) : appointments.isError ? (
                  <div className="rounded-[8px] border border-red-100 bg-red-50 px-4 py-5 text-sm text-red-700">{getFriendlyErrorMessage(appointments.error, "appointments")}</div>
                ) : appointments.data?.results.length ? (
                  appointments.data.results.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1F2937]">{formatDateTime(item.scheduled_at)}</p>
                        <p className="mt-1 text-sm text-slate-600">{appointmentCompanionLabel(user?.role)}</p>
                      </div>
                      <StatusBadge value={item.status} />
                    </div>
                  ))
                ) : (
                  <EmptyState title="No appointments yet" description="Your upcoming visits will appear here." action={<Link href="/appointments" className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[#2563EB] px-4 text-sm font-semibold text-white">Go to appointments</Link>} />
                )}
              </div>
            </div>

            <div className="ct-panel rounded-[8px] p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="ct-card-title text-[#1F2937]">Recent billing</h2>
                  <p className="mt-1 text-sm text-slate-500">Recent checkout activity.</p>
                </div>
                <Link className="text-sm font-semibold text-[#2563EB]" href="/payments">
                  Open
                </Link>
              </div>
              <div className="grid gap-3">
                {userQuery.isLoading || payments.isLoading ? (
                  <InlineLoader compact label="Loading your billing history" />
                ) : payments.isError ? (
                  <div className="rounded-[8px] border border-red-100 bg-red-50 px-4 py-5 text-sm text-red-700">{getFriendlyErrorMessage(payments.error, "payments")}</div>
                ) : payments.data?.results.length ? (
                  payments.data.results.map((item) => (
                    <div key={item.id} className="flex flex-col gap-3 rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1F2937]">{formatMoney(item.amount, item.currency)}</p>
                        <p className="mt-1 text-sm text-slate-600">{paymentSummary(item.provider, user?.role)}</p>
                      </div>
                      <StatusBadge value={item.status} />
                    </div>
                  ))
                ) : (
                  <EmptyState title="No billing history yet" description="Booked service payments will appear here." action={<Link href="/payments" className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[#2563EB] px-4 text-sm font-semibold text-white">Open billing history</Link>} />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </Section>
  );
}
