"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarClock, CheckCircle2, Clock3, MapPinned, Star } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { AvailabilityControl } from "@/features/providers/availability-control";
import { profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { NurseProfile } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";
import { activeAssignmentForRequest, homeCareStatusLabel, isHistoryRequest, recentActivitySummary } from "@/features/nurse/nurse-utils";
import { useNurseRequests } from "@/features/nurse/use-nurse-requests";
import { ProviderWalletPanel } from "@/features/provider-ledger/provider-wallet-panel";

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="ct-surface rounded-[24px] p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-sm font-semibold text-grey-500">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-grey-800">{value}</p>
      {description ? <p className="mt-3 text-sm leading-6 text-grey-600">{description}</p> : null}
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
  const requestsQuery = useNurseRequests(userQuery.data?.role === "nurse", 20);

  const user = userQuery.data;
  if (user?.role !== "nurse") {
    return (
      <Section title="Nurse dashboard" description="This workspace is available for nurse accounts only.">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const requests = requestsQuery.requests;
  const activeRequest = requests.find((item) => !isHistoryRequest(item.status) && activeAssignmentForRequest(item));
  const completedCount = requests.filter((item) => ["care_completed", "patient_confirmed"].includes(item.status)).length;
  const pendingOffers = requests.filter(
    (item) => item.current_assignment?.status === "pending" && item.status === "assigned",
  ).length;
  const recentRequests = requests.slice(0, 4);
  const rating = profileQuery.data?.rating;
  const reviewCount = profileQuery.data?.review_count ?? 0;
  const completedVisits = profileQuery.data?.completed_visits ?? completedCount;

  return (
    <Section
      title="Nurse dashboard"
      action={
        <AvailabilityControl
          compact
          queryKeys={[["profiles", "me", "nurse"], ["home-care", "available-nurses"]]}
        />
      }
    >
      {requestsQuery.isError ? (
        <Notice title="We couldn't load your nurse workspace." tone="warning">
          {getFriendlyErrorMessage(requestsQuery.error, "nurse")}
        </Notice>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="rounded-[30px] border border-white/70 bg-primary-500 p-6 text-white shadow-300 sm:p-8">
          <p className="ct-caption text-primary-100">Today</p>
          <h2 className="ct-dashboard-title mt-4 text-white sm:text-[2.3rem]">
            {activeRequest ? `Next visit: ${homeCareStatusLabel(activeRequest.status)}` : "You're ready for the next request"}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-primary-50/90 sm:text-base">
            {activeRequest ? `${activeRequest.contact_name_snapshot || "Patient"} - ${activeRequest.service_address_snapshot || "Address pending"}` : ""}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={activeRequest ? `/nurse/request/${activeRequest.id}` : "/nurse/requests"}
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-white px-5 text-sm font-extrabold text-[var(--primary)] shadow-400 shadow-primary-700/20 transition hover:-translate-y-0.5"
            >
              {activeRequest ? "Open active request" : "View assigned requests"}
            </Link>
            <Link
              href="/nurse/history"
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-white/25 bg-white/10 px-5 text-sm font-extrabold text-white transition hover:bg-white/16"
            >
              View history
            </Link>
          </div>
        </div>

        <div className="ct-panel rounded-[28px] p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="ct-card-title text-grey-800">Profile summary</p>
            </div>
            {profileQuery.data ? <Badge tone="blue">{profileQuery.data.active_for_dispatch ? "Available" : "Paused"}</Badge> : null}
          </div>
          {profileQuery.isLoading ? (
            <InlineLoader className="mt-6" compact label="Loading your profile" />
          ) : profileQuery.isError ? (
            <div className="mt-6 rounded-[18px] border border-warning-200 bg-warning-50 px-4 py-4 text-sm text-warning-900">
              {getFriendlyErrorMessage(profileQuery.error, "profile")}
            </div>
          ) : profileQuery.data ? (
            <div className="mt-6 grid gap-3 text-sm text-grey-600">
              <div className="ct-soft-panel rounded-[18px] px-4 py-3">
                <p className="font-semibold text-grey-800">License</p>
                <p className="mt-1">{profileQuery.data.license_no || "Not added yet"}</p>
                <p className="mt-1 text-xs text-grey-500">Issued by Caretekk. Contact admin for changes.</p>
              </div>
              <div className="ct-soft-panel rounded-[18px] px-4 py-3">
                <p className="font-semibold text-grey-800">Service zone</p>
                <p className="mt-1">{profileQuery.data.service_zone_label || "Zone not set"}</p>
                <p className="mt-1 text-xs text-grey-500">Managed by Caretekk operations.</p>
              </div>
              <div className="ct-soft-panel rounded-[18px] px-4 py-3">
                <p className="font-semibold text-grey-800">Rating</p>
                <p className="mt-1 flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning-400 text-warning-400" />
                  {rating ? `${rating}` : "No rating yet"}
                </p>
              </div>
              <div className="ct-soft-panel rounded-[18px] px-4 py-3">
                <p className="font-semibold text-grey-800">Reviews</p>
                <p className="mt-1">{reviewCount}</p>
              </div>
              <div className="ct-soft-panel rounded-[18px] px-4 py-3">
                <p className="font-semibold text-grey-800">Completed visits</p>
                <p className="mt-1">{completedVisits}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Completed visits"
          value={completedVisits}
          icon={CheckCircle2}
        />
        <MetricCard
          label="Pending offers"
          value={pendingOffers}
          icon={Clock3}
        />
        <MetricCard
          label="Active request"
          value={activeRequest ? 1 : 0}
          icon={CalendarClock}
        />
      </div>

      <ProviderWalletPanel role="nurse" />

      {profileQuery.data?.rating_breakdown && reviewCount > 0 ? (
        <div className="ct-panel rounded-[28px] p-6">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-warning-400 text-warning-400" />
            <h2 className="ct-card-title text-grey-800">Ratings</h2>
          </div>
          <div className="mt-5 grid gap-2">
            {[5, 4, 3, 2, 1].map((score) => {
              const item = profileQuery.data?.rating_breakdown?.[String(score)];
              return (
                <div key={score} className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)_4rem] sm:items-center">
                  <span className="text-sm font-semibold text-grey-800">{score} star</span>
                  <span className="h-2 overflow-hidden rounded-full bg-grey-100">
                    <span className="block h-full rounded-full bg-warning-400" style={{ width: `${item?.percentage ?? 0}%` }} />
                  </span>
                  <span className="text-sm text-grey-600">{item?.percentage ?? 0}%</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <div className="ct-panel rounded-[28px] p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="ct-card-title text-grey-800">Available Requests</h2>
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
                  className="ct-hover-lift rounded-[20px] border border-grey-200 bg-grey-50 px-4 py-4 hover:border-[rgba(57,97,169,0.18)] hover:bg-white"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-grey-800">{request.contact_name_snapshot || "Patient request"}</p>
                      <p className="mt-1 text-sm text-grey-600">
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
                    <div className="text-sm text-grey-500">{formatDateTime(request.updated_at)}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState title="No nurse activity yet" description="Assigned requests and updates will appear here when dispatch begins." />
          )}
        </div>

        <div className="ct-panel rounded-[28px] p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
              <MapPinned className="h-5 w-5" />
            </span>
            <div>
              <p className="ct-card-title text-grey-800">Current Assignment</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 text-sm text-grey-600">
            <div className="ct-soft-panel rounded-[18px] px-4 py-3">
              <p className="font-semibold text-grey-800">Verify first</p>
              <p className="mt-1">Travel unlocks after verification.</p>
            </div>
            <div className="ct-soft-panel rounded-[18px] px-4 py-3">
              <p className="font-semibold text-grey-800">Arrival</p>
              <p className="mt-1">Mark arrival when you reach the patient.</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
