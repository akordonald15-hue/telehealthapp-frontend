"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Home, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { ProviderPickerCard } from "@/features/providers/provider-picker-card";
import { homeCareApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { HomeCareRequestCreate, ProviderNurse } from "@/lib/types/backend";

function toIsoOrNull(value: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function HomeCareBookingClient() {
  const router = useRouter();
  const userQuery = useCurrentUser();
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [selectedNurse, setSelectedNurse] = useState<ProviderNurse | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const nursesQuery = useQuery({
    queryKey: ["home-care", "available-nurses", "simple"],
    queryFn: () => homeCareApi.availableNurses({ page_size: 50 }),
    enabled: userQuery.data?.role === "patient",
  });

  const createRequest = useMutation({
    mutationFn: (body: HomeCareRequestCreate & { callback_url: string }) => homeCareApi.bookRequest(body),
    onSuccess: (response) => {
      if (response.payment.authorization_url) {
        window.location.assign(response.payment.authorization_url);
        return;
      }
      router.replace(`/home-care/requests/${response.request.id}`);
    },
  });

  if (userQuery.data?.role !== "patient") {
    return (
      <Section title="Home Care" description="Home care is available for patient accounts.">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const nurseItems = nursesQuery.data?.results ?? [];

  return (
    <Section
      title="Home Care"
      action={
        <Link href="/home-care/requests" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
          View requests
        </Link>
      }
    >
      <div className="grid gap-5">
        <form
          className="ct-panel grid gap-4 rounded-[28px] p-5 sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const payload: HomeCareRequestCreate & { callback_url: string } = {
              booking_source: "direct",
              referral: null,
              preferred_nurse: selectedNurse?.id ?? null,
              contact_name_snapshot: contactName.trim(),
              contact_phone_snapshot: contactPhone.trim(),
              service_address_snapshot: address.trim(),
              service_location_notes: landmark.trim(),
              requested_window_start: toIsoOrNull(preferredTime),
              requested_window_end: null,
              care_notes: "",
              callback_url: `${window.location.origin}/home-care/requests`,
            };
            createRequest.mutate(payload);
          }}
        >
          {createRequest.error ? (
            <Notice title="We couldn't start home care." tone="warning">
              {getFriendlyErrorMessage(createRequest.error, "homeCare")}
            </Notice>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="ct-card-title text-[#1F2937]">₦5,000 home care visit</p>
              <p className="mt-1 text-sm text-slate-600">Choose a nurse and continue to secure checkout.</p>
            </div>
            <Button type="button" variant="secondary" onClick={() => setSelectorOpen(true)}>
              Choose Nurse
            </Button>
          </div>

          {selectedNurse ? (
            <div className="ct-soft-panel flex items-center justify-between gap-3 rounded-[20px] px-4 py-4">
              <div>
                <p className="font-semibold text-[#1F2937]">{selectedNurse.display_name}</p>
                <p className="mt-1 text-sm text-slate-600">{selectedNurse.service_type || "Home care"}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setSelectedNurse(null)}>
                Clear
              </Button>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact Name">
              <Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Phone Number">
              <Input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+234..." />
            </Field>
          </div>

          <Field label="Service Address">
            <Textarea value={address} onChange={(event) => setAddress(event.target.value)} rows={3} placeholder="Where should the nurse visit?" />
          </Field>

          <Field label="Landmark">
            <Textarea value={landmark} onChange={(event) => setLandmark(event.target.value)} rows={3} placeholder="Nearby landmark or access note" />
          </Field>

          <Field label="Preferred Time">
            <Input type="datetime-local" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} />
          </Field>

          <Button type="submit" disabled={createRequest.isPending}>
            {createRequest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {createRequest.isPending ? "Starting checkout..." : "Continue"}
          </Button>
        </form>
      </div>

      {selectorOpen ? (
        <div className="fixed inset-0 z-[70] bg-slate-950/40 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <h2 className="ct-card-title text-[#1F2937]">Choose Nurse</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectorOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
                aria-label="Close nurse selector"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              {nursesQuery.isLoading ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {[0, 1, 2, 3].map((item) => (
                    <div key={item} className="ct-surface rounded-[22px] p-4">
                      <div className="h-32 animate-pulse rounded-[16px] bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : nursesQuery.isError ? (
                <Notice title="We couldn't load nurses." tone="warning">
                  {getFriendlyErrorMessage(nursesQuery.error, "homeCare")}
                </Notice>
              ) : nurseItems.length ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {nurseItems.map((nurse) => (
                    <ProviderPickerCard
                      key={nurse.id}
                      name={nurse.display_name}
                      subtitle={nurse.service_type || "Home care"}
                      imageUrl={nurse.profile_image_url}
                      status={nurse.availability_status}
                      selected={selectedNurse?.id === nurse.id}
                      disabled={nurse.availability_status !== "available"}
                      actionLabel="Choose"
                      onSelect={() => {
                        setSelectedNurse(nurse);
                        setSelectorOpen(false);
                      }}
                    />
                  ))}
                </div>
              ) : (
                <EmptyHomeCareNurseState />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Section>
  );
}

function EmptyHomeCareNurseState() {
  return (
    <div className="ct-surface rounded-[24px] p-6 text-center">
      <Home className="mx-auto h-6 w-6 text-[var(--primary)]" />
      <p className="mt-3 font-semibold text-[#1F2937]">No nurses available right now.</p>
    </div>
  );
}
