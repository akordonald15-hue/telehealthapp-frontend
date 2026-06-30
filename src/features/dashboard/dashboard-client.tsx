"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  CreditCard,
  FileText,
  MessageSquareText,
  Sparkles,
  Stethoscope,
  Video,
} from "lucide-react";
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
import type { Appointment, PaginatedResponse, PatientProfile, Thread } from "@/lib/types/backend";
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

function firstName(value?: string | null) {
  return value?.trim().split(/\s+/)[0] || "there";
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function upcomingAppointment(items: Appointment[] | undefined) {
  const now = Date.now();
  return (items ?? [])
    .filter((item) => !["completed", "cancelled", "missed"].includes(item.status))
    .sort((left, right) => new Date(left.scheduled_at).getTime() - new Date(right.scheduled_at).getTime())
    .find((item) => new Date(item.scheduled_at).getTime() >= now) ?? (items ?? [])[0];
}

function latestThread(items: Thread[] | undefined) {
  return (items ?? [])
    .filter((thread) => thread.last_message)
    .sort((left, right) => {
      const leftTime = new Date(left.last_message?.created_at ?? left.updated_at ?? left.created_at).getTime();
      const rightTime = new Date(right.last_message?.created_at ?? right.updated_at ?? right.created_at).getTime();
      return rightTime - leftTime;
    })[0];
}

function shortTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function DashboardSkeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[8px] bg-slate-100 ${className}`} />;
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

  const paymentMetric = canLoadPayments ? listMetric(payments) : 0;
  const nextAppointment = upcomingAppointment(appointments.data?.results);
  const recentThread = latestThread(threads.data?.results);
  const patientName = firstName(user?.full_name || patientProfile.data?.full_name);
  const dashboardErrors = [
    appointments.isError ? `Appointments: ${getFriendlyErrorMessage(appointments.error, "dashboard")}` : null,
    threads.isError ? `Messages: ${getFriendlyErrorMessage(threads.error, "dashboard")}` : null,
    referrals.isError ? `Referrals: ${getFriendlyErrorMessage(referrals.error, "dashboard")}` : null,
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
                  className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[#2563EB] px-5 text-sm font-semibold text-white"
                >
                  Start with AI Assistant
                </Link>
              </>
            }
          >
            <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[8px] bg-[#DBEAFE] text-[#2563EB]">
                <Sparkles className="h-10 w-10 animate-pulse" />
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

          <div className="grid gap-6">
            <div className="grid gap-5">
              <div className="animate-[fadeIn_0.35s_ease-out]">
                <h2 className="font-heading text-2xl font-semibold tracking-[-0.02em] text-[#1F2937] sm:text-3xl">
                  {greeting()}, {patientName}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">How can we help you today?</p>
              </div>

              <Link
                href="/appointments"
                className="group overflow-hidden rounded-[8px] border border-[#DBEAFE] bg-[linear-gradient(135deg,#EFF6FF_0%,#F8FBFF_100%)] p-5 shadow-[0_24px_70px_-50px_rgba(37,99,235,0.35)] transition duration-200 hover:-translate-y-0.5 sm:p-6"
              >
                <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-[8px] bg-white text-[#2563EB] shadow-sm sm:h-28 sm:w-28">
                    <Stethoscope className="h-10 w-10 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#2563EB]">AI Health Assistant</p>
                    <h3 className="mt-2 font-heading text-2xl font-semibold leading-tight text-[#1F2937]">
                      How are you feeling today?
                    </h3>
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                      Tell us how you feel and we&apos;ll recommend the right doctor.
                    </p>
                    <span className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-[8px] bg-[#2563EB] px-5 text-sm font-semibold text-white shadow-[0_18px_42px_-28px_rgba(37,99,235,0.65)] sm:w-auto sm:min-w-[260px]">
                      Book a Doctor
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>

              <section className="rounded-[8px] border border-slate-100 bg-white p-4 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.36)] sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#DBEAFE] text-[#2563EB]">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <h3 className="font-semibold text-[#1F2937]">Upcoming Appointment</h3>
                  </div>
                  {nextAppointment ? <StatusBadge value={nextAppointment.status} /> : null}
                </div>
                {appointments.isLoading ? (
                  <div className="grid gap-3">
                    <DashboardSkeleton className="h-16" />
                    <DashboardSkeleton className="h-10" />
                  </div>
                ) : nextAppointment ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[8px] bg-slate-100 text-lg font-semibold text-[#2563EB]">
                        {nextAppointment.doctor_profile?.display_name?.slice(0, 2) || "Dr"}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#1F2937]">{nextAppointment.doctor_profile?.display_name || "Doctor"}</p>
                        <p className="mt-1 text-sm text-slate-600">Doctor consultation</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1 text-[#2563EB]">
                            <CalendarClock className="h-4 w-4" />
                            {formatDateTime(nextAppointment.scheduled_at)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            Secure chat
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/appointments/${nextAppointment.id}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-[#2563EB]/30 px-4 text-sm font-semibold text-[#2563EB]"
                    >
                      View Details
                    </Link>
                  </div>
                ) : (
                  <div className="rounded-[8px] bg-slate-50 px-4 py-5">
                    <p className="font-semibold text-[#1F2937]">No upcoming appointment</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">Book a doctor when you need care.</p>
                    <Link href="/appointments" className="mt-3 inline-flex text-sm font-semibold text-[#2563EB]">
                      Book a Doctor
                    </Link>
                  </div>
                )}
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-[#1F2937]">Recent Messages</h3>
                  <Link href="/messages" className="text-sm font-semibold text-[#2563EB]">View all</Link>
                </div>
                {threads.isLoading ? (
                  <DashboardSkeleton className="h-20" />
                ) : recentThread ? (
                  <Link
                    href="/messages"
                    className="flex items-center gap-4 rounded-[8px] border border-slate-100 bg-white p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.34)]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] bg-slate-100 text-sm font-semibold text-[#2563EB]">
                      {(recentThread.doctor_profile?.display_name || recentThread.patient_profile?.display_name || "Ct").slice(0, 2)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#1F2937]">
                        {recentThread.doctor_profile?.display_name || recentThread.patient_profile?.display_name || "Caretekk"}
                      </p>
                      <p className="mt-1 truncate text-sm text-slate-600">{recentThread.last_message?.body || "Open consultation thread"}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-slate-500">{shortTime(recentThread.last_message?.created_at)}</p>
                      {recentThread.unread_count ? (
                        <span className="mt-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#2563EB] px-2 text-xs font-semibold text-white">
                          {recentThread.unread_count}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ) : (
                  <div className="rounded-[8px] border border-slate-100 bg-white p-4 text-sm text-slate-600">
                    Your doctor messages will appear here.
                  </div>
                )}
              </section>
            </div>
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
                <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#DBEAFE] text-[#2563EB]">
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
