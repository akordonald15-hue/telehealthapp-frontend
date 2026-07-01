"use client";

import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { formatDateTime } from "@/lib/utils";
import { homeCareStatusLabel, isHistoryRequest, preferredTimeLabel } from "@/features/nurse/nurse-utils";
import { useNurseRequests } from "@/features/nurse/use-nurse-requests";

export function NurseHistoryClient() {
  const userQuery = useCurrentUser();
  const requestsQuery = useNurseRequests(userQuery.data?.role === "nurse", 50);

  if (userQuery.data?.role !== "nurse") {
    return (
      <Section title="History">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const history = requestsQuery.requests.filter((item) => isHistoryRequest(item.status));

  return (
    <Section title="History">
      {requestsQuery.isError ? (
        <Notice title="We couldn't load your home care updates." tone="warning">
          {getFriendlyErrorMessage(requestsQuery.error, "homeCare")}
        </Notice>
      ) : null}

      {requestsQuery.isLoading ? (
        <div className="grid gap-4" aria-busy="true" aria-label="Loading nurse history">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.45)]">
              <div className="h-5 w-44 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-4 h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-4 h-3 w-64 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
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
                  <p className="mt-1 text-sm text-slate-600">{request.service_name_snapshot || "Home care"}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                    <span>{homeCareStatusLabel(request.status)}</span>
                    <span>&bull;</span>
                    <span>{preferredTimeLabel(request)}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-500">{formatDateTime(request.updated_at)}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No history yet" description="" />
      )}
    </Section>
  );
}
