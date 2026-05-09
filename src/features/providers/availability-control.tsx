"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { StatusBadge } from "@/components/ui/status-badge";
import { providersApi } from "@/lib/api/endpoints";
import type { ProviderAvailabilityStatus } from "@/lib/types/backend";

const OPTIONS: Array<{ value: ProviderAvailabilityStatus; label: string }> = [
  { value: "available", label: "Available" },
  { value: "unavailable", label: "Unavailable" },
  { value: "busy", label: "Busy" },
  { value: "offline", label: "Offline" },
  { value: "on_break", label: "On break" },
];

export function AvailabilityControl({
  value,
  queryKeys,
}: {
  value?: ProviderAvailabilityStatus;
  queryKeys: string[][];
}) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ProviderAvailabilityStatus>(value ?? "available");
  const mutation = useMutation({
    mutationFn: providersApi.updateAvailability,
    onSuccess: async () => {
      await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
    },
  });

  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-[#1F2937]">Availability</p>
          <div className="mt-2">
            <StatusBadge value={value ?? selected} />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:min-w-[240px] sm:flex-row">
          <Select value={selected} onChange={(event) => setSelected(event.target.value as ProviderAvailabilityStatus)}>
            {OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            type="button"
            variant="secondary"
            disabled={mutation.isPending || selected === value}
            onClick={() => mutation.mutate({ availability_status: selected })}
          >
            {mutation.isPending ? "Saving..." : "Update"}
          </Button>
        </div>
      </div>
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
            Your current status has been saved.
          </Notice>
        </div>
      ) : null}
    </div>
  );
}
