"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { homeCareApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { formatDateTime } from "@/lib/utils";
import { bookingSourceLabel, homeCareStatusLabel, isHistoryRequest, preferredTimeLabel } from "@/features/nurse/nurse-utils";

export function NurseHistoryClient() {
  const userQuery = useCurrentUser();
  const requestsQuery = useQuery({
    queryKey: ["home-care", "requests", "history"],
    queryFn: () => homeCareApi.requests({ page_size: 50 }),
    enabled: userQuery.data?.role === "nurse",
  });

  if (userQuery.data?.role !== "nurse") {
    return (
      <Section title="History" description="Completed and closed nurse requests appear here.">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const history = (requestsQuery.data?.results ?? []).filter((item) => isHistoryRequest(item.status));

  return (
    <Section title="Nurse history" description="Review completed, cancelled, and unreachable requests without losing the full care timeline.">
      {requestsQuery.isError ? (
        <Notice title="We couldn't load your home care updates." tone="warning">
          {getFriendlyErrorMessage(requestsQuery.error, "homeCare")}
        </Notice>
      ) : null}

      {requestsQuery.isLoading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-10 text-sm text-slate-600">Loading history...</div>
      ) : history.length ? (
        <div className="grid gap-4">
          {history.map((request) => (
            <Link
              key={request.id}
              href={`/nurse/request/${request.id}`}
              className="rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">{request.contact_name_snapshot || "Patient request"}</p>
                  <p className="mt-1 text-sm text-slate-600">{request.service_address_snapshot || "Address not captured"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    <span>{homeCareStatusLabel(request.status)}</span>
                    <span>•</span>
                    <span>{bookingSourceLabel(request.booking_source)}</span>
                    <span>•</span>
                    <span>{preferredTimeLabel(request)}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-500">{formatDateTime(request.updated_at)}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No history yet" description="Completed and closed requests will appear here when visits begin to wrap up." />
      )}
    </Section>
  );
}
