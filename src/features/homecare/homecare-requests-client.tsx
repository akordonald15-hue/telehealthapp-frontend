"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Home } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { homeCareApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { formatDateTime } from "@/lib/utils";
import { bookingSourceLabel, homeCareStatusLabel, preferredTimeLabel } from "@/features/homecare/homecare-utils";

export function HomeCareRequestsClient() {
  const userQuery = useCurrentUser();
  const requestsQuery = useQuery({
    queryKey: ["home-care", "requests", "patient"],
    queryFn: () => homeCareApi.requests({ page_size: 50 }),
    enabled: userQuery.data?.role === "patient",
  });

  if (userQuery.data?.role !== "patient") {
    return (
      <Section title="My homecare requests" description="Homecare requests are available for patient accounts.">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const requests = requestsQuery.data?.results ?? [];

  return (
    <Section
      title="My homecare requests"
      description="Track home nurse booking, assignment, travel, completion, confirmation, and rating from one place."
      action={
        <Link href="/home-care/book" className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[var(--primary)] px-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5">
          Book home nurse
        </Link>
      }
    >
      {requestsQuery.isError ? (
        <Notice title="We couldn't load your homecare requests." tone="warning">
          {getFriendlyErrorMessage(requestsQuery.error, "homeCare")}
        </Notice>
      ) : null}

      {requestsQuery.isLoading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-10 text-sm text-slate-600">Loading homecare requests...</div>
      ) : requests.length ? (
        <div className="grid gap-4">
          {requests.map((request) => {
            const nurse = request.current_assignment?.nurse;
            return (
              <Link
                key={request.id}
                href={`/home-care/requests/${request.id}`}
                className="group rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 sm:p-6"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-xl font-semibold text-[#1F2937]">
                        {request.contact_name_snapshot || "Home nurse request"}
                      </h2>
                      <Badge tone="blue">{homeCareStatusLabel(request.status)}</Badge>
                      <Badge>{bookingSourceLabel(request.booking_source)}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {request.service_address_snapshot || "Address details will appear here."}
                    </p>
                    <div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-[#1F2937]">Assigned nurse</p>
                        <p className="mt-1">{nurse ? nurse.user_email : "Waiting for assignment"}</p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-[#1F2937]">Preferred time</p>
                        <p className="mt-1">{preferredTimeLabel(request)}</p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-[#1F2937]">Created</p>
                        <p className="mt-1">{formatDateTime(request.created_at)}</p>
                      </div>
                      <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="font-semibold text-[#1F2937]">Last update</p>
                        <p className="mt-1">{formatDateTime(request.updated_at)}</p>
                      </div>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                    View detail <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={Home}
          title="No homecare requests yet"
          description="Book a home nurse when you need coordinated care at home."
          action={
            <Link href="/home-care/book" className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[var(--primary)] px-4 text-sm font-extrabold text-white">
              Book home nurse
            </Link>
          }
        />
      )}
    </Section>
  );
}
