"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPinned } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { homeCareApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { formatDateTime } from "@/lib/utils";
import {
  bookingSourceLabel,
  canAcceptAssignment,
  canDeclineAssignment,
  homeCareStatusLabel,
  preferredTimeLabel,
  requestDistanceLabel,
} from "@/features/nurse/nurse-utils";
import { useNurseRequests } from "@/features/nurse/use-nurse-requests";

export function NurseRequestsClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [declineReason, setDeclineReason] = useState<Record<number, string>>({});
  const requestsQuery = useNurseRequests(userQuery.data?.role === "nurse", 50);
  const acceptMutation = useMutation({
    mutationFn: homeCareApi.acceptAssignment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["home-care"] });
    },
  });
  const declineMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => homeCareApi.declineAssignment(id, { reason }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["home-care"] });
    },
  });

  if (userQuery.data?.role !== "nurse") {
    return (
      <Section title="Requests">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const activeRequests = requestsQuery.requests.filter(
    (item) => !["care_completed", "patient_confirmed", "cancelled", "unreachable"].includes(item.status),
  );

  return (
    <Section
      title="Available requests"
    >
      {requestsQuery.isError ? (
        <Notice title="We couldn't load your home care updates." tone="warning">
          {getFriendlyErrorMessage(requestsQuery.error, "homeCare")}
        </Notice>
      ) : null}

      {requestsQuery.isLoading ? (
        <div className="grid gap-4" aria-busy="true" aria-label="Loading nurse requests">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6"
            >
              <div className="h-5 w-48 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-4 h-4 w-4/5 animate-pulse rounded-full bg-slate-100" />
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((tile) => (
                  <div key={tile} className="h-20 animate-pulse rounded-[18px] bg-slate-50" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : activeRequests.length ? (
        <div className="grid gap-4">
          {activeRequests.map((request) => {
            const assignment = request.current_assignment;
            const declineText = assignment ? declineReason[assignment.id] || "" : "";

            return (
              <div
                key={request.id}
                className="rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-heading text-xl font-semibold text-[#1F2937]">
                        {request.contact_name_snapshot || "Patient request"}
                      </p>
                      <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
                        {homeCareStatusLabel(request.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {request.service_address_snapshot || "Address details will appear here."}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-[#1F2937]">Booking source</p>
                        <p className="mt-1">{bookingSourceLabel(request.booking_source)}</p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-[#1F2937]">Preferred time</p>
                        <p className="mt-1">{preferredTimeLabel(request)}</p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-[#1F2937]">Distance</p>
                        <p className="mt-1">{requestDistanceLabel(request)}</p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-[#1F2937]">Last update</p>
                        <p className="mt-1">{formatDateTime(request.updated_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="w-full xl:w-[320px]">
                    <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-[var(--primary)]">
                          <MapPinned className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-[#1F2937]">Current assignment</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {assignment ? homeCareStatusLabel(assignment.status) : "Waiting for assignment"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3">
                        <Link
                          href={`/nurse/request/${request.id}`}
                          className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[var(--primary)] px-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
                        >
                          Open request
                        </Link>

                        {assignment && canAcceptAssignment(assignment, request) ? (
                          <Button
                            onClick={() => acceptMutation.mutate(assignment.id)}
                            disabled={acceptMutation.isPending}
                            className="w-full"
                          >
                            {acceptMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Accept
                          </Button>
                        ) : null}

                        {assignment && canDeclineAssignment(assignment, request) ? (
                          <div className="grid gap-2">
                            <input
                              value={declineText}
                              onChange={(event) =>
                                setDeclineReason((current) => ({ ...current, [assignment.id]: event.target.value }))
                              }
                              placeholder="Add a reason if you decline"
                              className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937] outline-none ring-0 transition focus:border-[var(--primary)]"
                            />
                            <Button
                              variant="secondary"
                              onClick={() =>
                                declineMutation.mutate({
                                  id: assignment.id,
                                  reason: declineText || "Unavailable for this request right now.",
                                })
                              }
                              disabled={declineMutation.isPending}
                            >
                              Decline
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No active requests"
          description=""
        />
      )}
    </Section>
  );
}
