"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Clock3, MapPinned, Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { NurseProfile } from "@/lib/types/backend";
import { ProviderWalletPanel } from "@/features/provider-ledger/provider-wallet-panel";
import { AvailabilityControl } from "@/features/providers/availability-control";
import { homeCareApi, profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { formatDateTime } from "@/lib/utils";
import { activeAssignmentForRequest, homeCareStatusLabel, isHistoryRequest, recentActivitySummary } from "@/features/nurse/nurse-utils";

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
    <div className="ct-card rounded-[26px] p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[0_16px_28px_-22px_rgba(66,107,179,0.45)]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold tracking-[-0.04em] text-[#1F2937]">{value}</p>
      <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
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
      action={profileQuery.data ? <StatusBadge value={profileQuery.data.availability_status} /> : null}
    >
      {requestsQuery.isError ? (
        <Notice title="We couldn't load your nurse workspace." tone="warning">
          {getFriendlyErrorMessage(requestsQuery.error, "nurse")}
        </Notice>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.82fr)]">
        <div className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_82%_16%,rgba(255,255,255,0.16),transparent_26%),linear-gradient(135deg,#17376E_0%,#355A9E_55%,#60A5FA_100%)] p-6 text-white shadow-[0_34px_90px_-44px_rgba(53,90,158,0.62)] sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-100/90">Nurse dashboard</p>
          <h2 className="font-heading mt-4 text-[clamp(2rem,4vw,3.45rem)] font-semibold tracking-[-0.055em]">
            {activeRequest ? `Next visit: ${homeCareStatusLabel(activeRequest.status)}` : "You're ready for the next request"}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-blue-50/90 sm:text-[1rem]">
            {activeRequest
              ? `${activeRequest.contact_name_snapshot || "Patient"} - ${activeRequest.service_address_snapshot || "Address pending"}`
              : "Accepted requests, travel updates, and visit completion all stay connected here."}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={activeRequest ? `/nurse/request/${activeRequest.id}` : "/nurse/requests"} className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-white px-5 text-sm font-extrabold text-[var(--primary)] shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5">
              {activeRequest ? "Open active request" : "View assigned requests"}
            </Link>
            <Link href="/nurse/history" className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-white/25 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:bg-white/16">
              View history
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Completed", value: `${completedCount} visits` },
              { label: "Pending offers", value: `${pendingOffers} waiting` },
              { label: "Current request", value: activeRequest ? "In progress" : "None active" },
            ].map((item) => (
              <div key={item.label} className="rounded-[20px] border border-white/16 bg-white/10 px-4 py-4 backdrop-blur">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/75">{item.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="ct-panel p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-heading text-[1.35rem] font-semibold tracking-[-0.04em] text-[#1F2937]">Profile summary</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Your dispatch details and visit readiness at a glance.</p>
            </div>
            {profileQuery.data ? <Badge tone="blue">{profileQuery.data.active_for_dispatch ? "dispatch ready" : "paused"}</Badge> : null}
          </div>
          {profileQuery.isLoading ? (
            <div className="mt-6 rounded-[20px] border border-slate-200 bg-[var(--surface-soft)] px-4 py-4 text-sm text-slate-600">Loading your profile...</div>
          ) : profileQuery.isError ? (
            <div className="mt-6 rounded-[20px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
              {getFriendlyErrorMessage(profileQuery.error, "profile")}
            </div>
          ) : profileQuery.data ? (
            <div className="mt-6 grid gap-3 text-sm text-slate-600">
              <div className="rounded-[20px] border border-slate-200 bg-[var(--surface-soft)] px-4 py-4">
                <p className="font-semibold text-[#1F2937]">License</p>
                <p className="mt-1 leading-6">{profileQuery.data.license_no || "Not added yet"}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-[var(--surface-soft)] px-4 py-4">
                <p className="font-semibold text-[#1F2937]">Base area</p>
                <p className="mt-1 leading-6">{profileQuery.data.base_address || "Base address not added yet"}</p>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-[var(--surface-soft)] px-4 py-4">
                <p className="font-semibold text-[#1F2937]">Service radius</p>
                <p className="mt-1 leading-6">{profileQuery.data.service_radius_km} km</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Completed visits" value={completedCount} description="Visits finished and ready for patient confirmation or closure." icon={CheckCircle2} />
        <MetricCard label="Pending offers" value={pendingOffers} description="Requests waiting for your accept or decline decision." icon={Clock3} />
        <MetricCard label="Active request" value={activeRequest ? 1 : 0} description="Your current visit in progress or awaiting the next step." icon={CalendarClock} />
        <MetricCard label="Rating" value="No ratings yet" description="Patient ratings will appear here once they are added to the nurse summary." icon={Star} />
      </div>

      <AvailabilityControl
        key={profileQuery.data?.availability_status ?? "nurse-availability-loading"}
        value={profileQuery.data?.availability_status}
        queryKeys={[["profiles", "me", "nurse"], ["home-care", "available-nurses"]]}
      />

      <ProviderWalletPanel role="nurse" />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="ct-panel p-6">
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
                  className="rounded-[22px] border border-slate-200/90 bg-[var(--surface-soft)] px-4 py-4 transition hover:border-[rgba(66,107,179,0.18)] hover:bg-white"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">{request.contact_name_snapshot || "Patient request"}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {recentActivitySummary({
                          id: request.id,
                          event_type: request.status,
                          from_status: "",
                          to_status: request.status,
                          metadata: {},
                          actor: null,
                          actor_email: null,
                          assignment: request.current_assignment?.id ?? null,
                          created_at: request.updated_at,
                        })}
                      </p>
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

        <div className="ct-panel p-6">
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
            <div className="rounded-[20px] border border-slate-200 bg-[var(--surface-soft)] px-4 py-4">
              <p className="font-semibold text-[#1F2937]">Pre-visit first</p>
              <p className="mt-1 leading-6">Travel starts only after the patient is confirmed.</p>
            </div>
            <div className="rounded-[20px] border border-slate-200 bg-[var(--surface-soft)] px-4 py-4">
              <p className="font-semibold text-[#1F2937]">Track progress cleanly</p>
              <p className="mt-1 leading-6">Location updates are optional and handled gracefully when permissions are unavailable.</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
