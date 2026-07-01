"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarClock,
  FileText,
  MessageSquareText,
  SendHorizonal,
  Star,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProviderWalletPanel } from "@/features/provider-ledger/provider-wallet-panel";
import { AvailabilityControl } from "@/features/providers/availability-control";
import { appointmentsApi, messagingApi, profilesApi, referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { Appointment, DoctorProfile, Referral, Thread } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";

function countValue<T>(query: { data?: { count?: number; results: T[] }; isLoading: boolean; isError: boolean }) {
  if (query.isLoading) {
    return "...";
  }
  if (query.isError) {
    return "Error";
  }
  return query.data?.count ?? query.data?.results.length ?? 0;
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="ct-surface rounded-[8px] p-4 sm:p-5">
      <span className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-[#ECFEFF] text-[#0F766E]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-[#1F2937]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function QuickAction({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="ct-hover-lift rounded-[8px] border border-slate-200 bg-slate-50 p-4 hover:border-cyan-100 hover:bg-white hover:shadow-[0_18px_44px_-34px_rgba(15,118,110,0.24)]"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-white text-[#0F766E] shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-[#1F2937]">{label}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function AppointmentRow({ appointment }: { appointment: Appointment }) {
  const patientName = appointment.patient_profile?.display_name || "Patient";
  return (
    <Link href={`/appointments/${appointment.id}`} className="ct-hover-lift block rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-4 hover:border-cyan-100 hover:bg-white">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-semibold text-[#1F2937]">{formatDateTime(appointment.scheduled_at)}</p>
          <p className="mt-1 truncate text-sm text-slate-600">{patientName}</p>
          {appointment.reason ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{appointment.reason}</p> : null}
        </div>
        <StatusBadge value={appointment.status} />
      </div>
    </Link>
  );
}

function ReferralRow({ referral }: { referral: Referral }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="break-words font-semibold text-[#1F2937]">{referral.referred_to || "Referral"}</p>
          <p className="mt-1 text-sm text-slate-600">{referral.patient_name || "Patient"}</p>
          {referral.notes ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{referral.notes}</p> : null}
        </div>
        <StatusBadge value={referral.status} />
      </div>
    </div>
  );
}

function ThreadRow({ thread }: { thread: Thread }) {
  const patientName = thread.patient_profile?.display_name || `Patient #${thread.patient}`;
  const preview = thread.last_message?.body || thread.triage_summary?.symptoms?.join(", ") || "Open consultation thread";
  return (
    <Link href="/messages" className="ct-hover-lift block rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-4 hover:border-cyan-100 hover:bg-white">
      <p className="truncate font-semibold text-[#1F2937]">{patientName}</p>
      <p className="mt-1 line-clamp-1 text-sm text-slate-600">{preview}</p>
    </Link>
  );
}

export function DoctorDashboardClient() {
  const userQuery = useCurrentUser();
  const appointments = useQuery({
    queryKey: ["appointments", "doctor-dashboard"],
    queryFn: () => appointmentsApi.list({ page_size: 20 }),
    enabled: userQuery.data?.role === "doctor",
  });
  const threads = useQuery({
    queryKey: ["threads", "doctor-dashboard"],
    queryFn: () => messagingApi.threads({ page_size: 10 }),
    enabled: userQuery.data?.role === "doctor",
  });
  const referrals = useQuery({
    queryKey: ["referrals", "doctor-dashboard"],
    queryFn: () => referralsApi.list({ page_size: 10 }),
    enabled: userQuery.data?.role === "doctor",
  });
  const profileQuery = useQuery({
    queryKey: ["profile", "me", "doctor"],
    queryFn: () => profilesApi.me<DoctorProfile>(),
    enabled: userQuery.data?.role === "doctor",
  });
  if (userQuery.data?.role !== "doctor") {
    return (
      <Section title="Doctor dashboard" description="This workspace is available for doctor accounts only.">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const appointmentItems = appointments.data?.results ?? [];
  const todayAppointments = appointmentItems.filter((appointment) => isToday(appointment.scheduled_at));
  const threadItems = threads.data?.results ?? [];
  const referralItems = referrals.data?.results ?? [];
  const recentPatients = Array.from(
    new Map(
      [
        ...appointmentItems.map((appointment) => [
          appointment.patient,
          appointment.patient_profile?.display_name || `Patient #${appointment.patient}`,
        ] as const),
        ...referralItems.map((referral) => [
          referral.patient,
          referral.patient_name || `Patient #${referral.patient}`,
        ] as const),
      ],
    ).entries(),
  ).slice(0, 6);
  const firstConsultationHref = appointmentItems[0] ? `/appointments/${appointmentItems[0].id}` : "/appointments";
  const dashboardErrors = [
    appointments.isError ? `Appointments: ${getFriendlyErrorMessage(appointments.error, "dashboard")}` : null,
    threads.isError ? `Messages: ${getFriendlyErrorMessage(threads.error, "dashboard")}` : null,
    referrals.isError ? `Referrals: ${getFriendlyErrorMessage(referrals.error, "dashboard")}` : null,
  ].filter(Boolean);
  const doctorRating = profileQuery.data?.rating;
  const reviewCount = profileQuery.data?.review_count ?? 0;
  const completedConsultations = profileQuery.data?.completed_consultations ?? appointmentItems.filter((appointment) => appointment.status === "completed").length;

  return (
    <Section
      title="Doctor dashboard"
      description="Consultations, messages, care plans, and referrals."
      action={
        <AvailabilityControl
          compact
          queryKeys={[["profiles", "me", "doctor"], ["appointments", "available-doctors"]]}
        />
      }
    >
      {dashboardErrors.length ? (
        <Notice title="Some doctor workspace data could not load." tone="warning">
          {dashboardErrors.join(" ")}
        </Notice>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[8px] border border-white/70 bg-[linear-gradient(135deg,#0F766E_0%,#2563EB_58%,#60A5FA_100%)] p-5 text-white shadow-[0_24px_64px_-42px_rgba(15,118,110,0.4)] sm:p-6">
          <p className="ct-caption text-cyan-50">Doctor workspace</p>
          <h2 className="mt-3 font-heading text-2xl font-semibold leading-tight text-white sm:text-[2rem]">
            {todayAppointments.length ? `${todayAppointments.length} consultation${todayAppointments.length === 1 ? "" : "s"} today` : "No consultations scheduled for today"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-cyan-50/90">Open consultations and continue care.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/appointments" className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-white px-4 text-sm font-semibold text-[#0F766E] shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5">
              View consultations
            </Link>
            <Link href="/messages" className="inline-flex min-h-10 items-center justify-center rounded-[8px] border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/16">
              Open messages
            </Link>
          </div>
        </div>

        <div className="ct-panel rounded-[8px] p-5">
          <p className="ct-card-title text-[#1F2937]">Quick actions</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Start from a consultation.</p>
          <div className="mt-4 grid gap-3">
            <QuickAction href="/appointments" label="View appointments" description="Today and upcoming." icon={CalendarClock} />
            <QuickAction href="/messages" label="Open messages" description="Patient conversations." icon={MessageSquareText} />
            <QuickAction href={firstConsultationHref} label="Create referral" description="From consultation detail." icon={SendHorizonal} />
            <QuickAction href={firstConsultationHref} label="Create care plan" description="For this patient." icon={FileText} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label={"Today's consultations"} value={todayAppointments.length} description="Appointments scheduled for today." icon={Stethoscope} />
        <StatCard label="Completed" value={completedConsultations} description="Completed consultations." icon={CalendarClock} />
        <StatCard label="Messages" value={countValue(threads)} description="Patient conversations." icon={MessageSquareText} />
        <StatCard label="Ratings" value={doctorRating ? `${doctorRating}/5` : "New"} description={`${reviewCount} review${reviewCount === 1 ? "" : "s"}`} icon={Star} />
      </div>

      <ProviderWalletPanel role="doctor" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="ct-panel rounded-[8px] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="ct-card-title text-[#1F2937]">{"Today's appointments"}</h2>
              <p className="mt-1 text-sm text-slate-500">Open a consultation for patient context and next actions.</p>
            </div>
            <Link className="text-sm font-semibold text-[#0F766E]" href="/appointments">
              View all
            </Link>
          </div>
          {appointments.isLoading ? (
            <InlineLoader compact label="Loading consultations" />
          ) : todayAppointments.length ? (
            <div className="grid gap-3">
              {todayAppointments.slice(0, 5).map((appointment) => (
                <AppointmentRow key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ) : (
            <EmptyState title="No consultations today" description="Scheduled appointments for today will appear here." />
          )}
        </div>

        <div className="ct-panel rounded-[8px] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="ct-card-title text-[#1F2937]">Recent patients</h2>
              <p className="mt-1 text-sm text-slate-500">Patients from recent activity.</p>
            </div>
            <UserRoundCheck className="h-5 w-5 text-[#0F766E]" />
          </div>
          {appointments.isLoading || referrals.isLoading ? (
            <InlineLoader compact label="Loading patient overview" />
          ) : recentPatients.length ? (
            <div className="grid gap-3">
              {recentPatients.map(([patientId, patientName]) => (
                <div key={patientId} className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="truncate font-semibold text-[#1F2937]">{patientName}</p>
                  <p className="mt-1 text-sm text-slate-600">Open a consultation for next actions.</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent patients yet" description="Patients appear here once appointments or referrals are available." />
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="ct-panel rounded-[8px] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="ct-card-title text-[#1F2937]">Patient messages</h2>
              <p className="mt-1 text-sm text-slate-500">Recent conversations.</p>
            </div>
            <Link className="text-sm font-semibold text-[#0F766E]" href="/messages">
              Open messages
            </Link>
          </div>
          {threads.isLoading ? (
            <InlineLoader compact label="Loading consultation messages" />
          ) : threadItems.length ? (
            <div className="grid gap-3">
              {threadItems.slice(0, 4).map((thread) => (
                <ThreadRow key={thread.id} thread={thread} />
              ))}
            </div>
          ) : (
            <EmptyState title="No patient messages yet" description="Patient conversations appear here when a thread is created." />
          )}
        </div>

        <div className="ct-panel rounded-[8px] p-5 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="ct-card-title text-[#1F2937]">Referral notes</h2>
              <p className="mt-1 text-sm text-slate-500">Recent referral context from consultations.</p>
            </div>
            <Link className="text-sm font-semibold text-[#0F766E]" href="/appointments">
              Open consultations
            </Link>
          </div>
          {referrals.isLoading ? (
            <InlineLoader compact label="Loading referral activity" />
          ) : referralItems.length ? (
            <div className="grid gap-3">
              {referralItems.slice(0, 4).map((referral) => (
                <ReferralRow key={referral.id} referral={referral} />
              ))}
            </div>
          ) : (
            <EmptyState title="No referrals yet" description="Create referrals from a patient consultation." />
          )}
        </div>
      </div>
    </Section>
  );
}
