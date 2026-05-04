"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Clock3, MapPinned, Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { homeCareApi, profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { NurseProfile } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";
import { activeAssignmentForRequest, homeCareStatusLabel, isHistoryRequest, recentActivitySummary } from "@/features/nurse/nurse-utils";
import { ProviderWalletPanel } from "@/features/provider-ledger/provider-wallet-panel";

function MetricCard({
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
    <div className="rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.45)]">
      <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-[#1F2937]">{value}</p>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export function NurseDashboardClient() {
  const userQuery = useCurrentUser();
  const profileQuery = useQuery({
    queryKey: ["profiles", "me", "nurse"],
    queryFn: () => profilesApi.me<NurseProfile>(),
    enabled: userQuery.data?.role === "nurse",
  });
  const requestsQuery = useQuery({
    queryKey: ["home-care", "requests", "dashboard"],
    queryFn: () => homeCareApi.requests({ page_size: 20 }),
    enabled: userQuery.data?.role === "nurse",
  });

  const user = userQuery.data;
  if (user?.role !== "nurse") {
    return (
      <Section title="Nurse dashboard" description="This workspace is available for nurse accounts only.">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const requests = requestsQuery.data?.results ?? [];
  const activeRequest = requests.find((item) => !isHistoryRequest(item.status) && activeAssignmentForRequest(item));
  const completedCount = requests.filter((item) => ["care_completed", "patient_confirmed"].includes(item.status)).length;
  const pendingOffers = requests.filter((item) => item.current_assignment?.status === "pending" && item.status === "assigned").length;
  const recentRequests = requests.slice(0, 4);

  return (
    <Section
      title="Nurse dashboard"
      description="Stay on top of assigned visits, pre-visit checks, travel, and care completion from one clean workspace."
      action={profileQuery.data ? <Badge tone="blue">{profileQuery.data.availability_status}</Badge> : null}
    >
      {requestsQuery.isError ? (
        <Notice title="We couldn't load your nurse workspace." tone="warning">
          {getFriendlyErrorMessage(requestsQuery.error, "nurse")}
        </Notice>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[28px] border border-white/70 bg-[linear-gradient(135deg,var(--primary-strong)_0%,var(--primary)_55%,var(--accent)_100%)] p-6 text-white shadow-[0_30px_80px_-40px_rgba(66,107,179,0.65)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-blue-100">Today&apos;s care journey</p>
          <h2 className="font-heading mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            {activeRequest ? `Next visit: ${homeCareStatusLabel(activeRequest.status)}` : "You're ready for the next request"}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-50/90 sm:text-base">
            {activeRequest
              ? `${activeRequest.contact_name_snapshot || "Patient"} - ${activeRequest.service_address_snapshot || "Address pending"}`
              : "Accepted requests, travel updates, and visit completion all stay connected here."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={activeRequest ? `/nurse/request/${activeRequest.id}` : "/nurse/requests"} className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-white px-5 text-sm font-extrabold text-[var(--primary)] shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5">
              {activeRequest ? "Open active request" : "View assigned requests"}
            </Link>
            <Link href="/nurse/history" className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-white/25 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:bg-white/16">
              View history
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-xl font-semibold text-[#1F2937]">Profile summary</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Your dispatch details and visit readiness at a glance.</p>
            </div>
            {profileQuery.data ? <Badge tone="blue">{profileQuery.data.active_for_dispatch ? "dispatch ready" : "paused"}</Badge> : null}
          </div>
          {profileQuery.isLoading ? (
            <div className="mt-6 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">Loading your profile...</div>
          ) : profileQuery.isError ? (
            <div className="mt-6 rounded-[18px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              {getFriendlyErrorMessage(profileQuery.error, "profile")}
            </div>
          ) : profileQuery.data ? (
            <div className="mt-6 grid gap-3 text-sm text-slate-600">
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-[#1F2937]">License</p>
                <p className="mt-1">{profileQuery.data.license_no || "Not added yet"}</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-[#1F2937]">Base area</p>
                <p className="mt-1">{profileQuery.data.base_address || "Base address not added yet"}</p>
              </div>
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="font-semibold text-[#1F2937]">Service radius</p>
                <p className="mt-1">{profileQuery.data.service_radius_km} km</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Completed visits" value={completedCount} description="Visits finished and ready for patient confirmation or closure." icon={CheckCircle2} />
        <MetricCard label="Pending offers" value={pendingOffers} description="Requests waiting for your accept or decline decision." icon={Clock3} />
        <MetricCard label="Active request" value={activeRequest ? 1 : 0} description="Your current visit in progress or awaiting the next step." icon={CalendarClock} />
        <MetricCard label="Rating" value="--" description="Patient ratings will appear here once they are added to the nurse summary." icon={Star} />
      </div>

      <ProviderWalletPanel role="nurse" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-xl font-semibold text-[#1F2937]">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-500">The latest changes across your visible requests.</p>
            </div>
            <Link className="text-sm font-semibold text-[var(--primary)]" href="/nurse/requests">
              Open requests
            </Link>
          </div>
          {recentRequests.length ? (
            <div className="grid gap-3">
              {recentRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/nurse/request/${request.id}`}
                  className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-[rgba(66,107,179,0.18)] hover:bg-white"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">{request.contact_name_snapshot || "Patient request"}</p>
                      <p className="mt-1 text-sm text-slate-600">{recentActivitySummary({ id: request.id, event_type: request.status, from_status: "", to_status: request.status, metadata: {}, actor: null, actor_email: null, assignment: request.current_assignment?.id ?? null, created_at: request.updated_at })}</p>
                    </div>
                    <div className="text-sm text-slate-500">{formatDateTime(request.updated_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No nurse activity yet" description="Assigned requests and updates will appear here when dispatch begins." />
          )}
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
              <MapPinned className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-[#1F2937]">Travel and arrival</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Use the request detail page to start your trip, share location if available, and mark arrival when you reach the patient.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-slate-600">
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-semibold text-[#1F2937]">Pre-visit first</p>
              <p className="mt-1">Travel starts only after the patient is confirmed.</p>
            </div>
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="font-semibold text-[#1F2937]">Track progress cleanly</p>
              <p className="mt-1">Location updates are optional and handled gracefully when permissions are unavailable.</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
