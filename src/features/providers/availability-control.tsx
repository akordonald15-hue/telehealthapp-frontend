"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { StatusBadge } from "@/components/ui/status-badge";
import { providersApi } from "@/lib/api/endpoints";
import type { ProviderAvailabilityStatus } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";

const OPTIONS: Array<{ value: ProviderAvailabilityStatus; label: string; description: string }> = [
  { value: "available", label: "Available", description: "Ready for new consultations or assignments." },
  { value: "on_break", label: "On break", description: "Temporarily pause new work while staying signed in." },
  { value: "offline", label: "Offline", description: "Hide yourself from new patient booking and dispatch." },
];

export function AvailabilityControl({
  queryKeys,
}: {
  queryKeys: string[][];
}) {
  const queryClient = useQueryClient();
  const availabilityQuery = useQuery({
    queryKey: ["providers", "me", "availability"],
    queryFn: providersApi.myAvailability,
  });
  const mutation = useMutation({
    mutationFn: providersApi.updateAvailability,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["providers", "me", "availability"] }),
        ...queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })),
      ]);
    },
  });

  const data = availabilityQuery.data;
  const selectedStatus = data?.preferred_availability_status ?? "offline";
  const disabledReason = data?.blocked_reason ?? "";

  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-[#1F2937]">Availability</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge value={data?.availability_status ?? "offline"} />
            {data?.active_job_label ? <span className="text-xs font-semibold text-slate-500">{data.active_job_label}</span> : null}
          </div>
          {data?.last_active_at ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">Last active {formatDateTime(data.last_active_at)}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {OPTIONS.map((option) => {
          const isSelected = selectedStatus === option.value;
          const disabled =
            mutation.isPending ||
            availabilityQuery.isLoading ||
            (data ? !data.can_self_update && option.value !== data.preferred_availability_status : false) ||
            (data ? data.allowed_statuses.indexOf(option.value) === -1 : false);
          return (
            <div
              key={option.value}
              className={`rounded-[16px] border p-3 transition ${
                isSelected ? "border-[var(--primary)] bg-white shadow-[0_10px_30px_-22px_rgba(66,107,179,0.4)]" : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-[#1F2937]">{option.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{option.description}</p>
                </div>
                <Button
                  type="button"
                  variant={isSelected ? "primary" : "secondary"}
                  disabled={disabled || (data?.preferred_availability_status === option.value && data?.availability_status === option.value)}
                  onClick={() => mutation.mutate({ availability_status: option.value })}
                >
                  {mutation.isPending && option.value === mutation.variables?.availability_status ? "Saving..." : isSelected ? "Selected" : "Set"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {!data?.can_self_update && disabledReason ? (
        <div className="mt-3">
          <Notice title="Availability is locked right now." tone="warning">
            {disabledReason}
          </Notice>
        </div>
      ) : null}
      {availabilityQuery.isError ? (
        <div className="mt-3">
          <Notice title="Availability could not be loaded." tone="warning">
            {availabilityQuery.error instanceof Error ? availabilityQuery.error.message : "Please refresh and try again."}
          </Notice>
        </div>
      ) : null}
      {mutation.isError ? (
        <div className="mt-3">
          <Notice title="Availability could not be updated." tone="warning">
            {mutation.error instanceof Error ? mutation.error.message : "Please try again."}
          </Notice>
        </div>
      ) : null}
      {mutation.isSuccess ? (
        <div className="mt-3">
          <Notice title="Availability updated" tone="success">
            Your preferred status has been saved.
          </Notice>
        </div>
      ) : null}
    </div>
  );
}
