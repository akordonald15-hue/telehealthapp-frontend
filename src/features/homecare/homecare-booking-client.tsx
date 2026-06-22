"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Home, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { ProviderPickerCard } from "@/features/providers/provider-picker-card";
import { homeCareApi, profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { HomeCareRequestCreate, HomeCareService, HomeCareZone, PatientProfile, ProviderNurse } from "@/lib/types/backend";
import { formatMoney } from "@/lib/utils";

const HOMECARE_ZONES: Array<{ value: HomeCareZone; label: string }> = [
  { value: "eket", label: "Eket" },
  { value: "uyo", label: "Uyo" },
];

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
  const [zone, setZone] = useState<HomeCareZone | "">("");
  const [selectedServiceId, setSelectedServiceId] = useState<number | "">("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedNurse, setSelectedNurse] = useState<ProviderNurse | null>(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", "me", "patient", "homecare-booking"],
    queryFn: () => profilesApi.me<PatientProfile>(),
    enabled: userQuery.data?.role === "patient",
  });

  const servicesQuery = useQuery({
    queryKey: ["home-care", "services", zone],
    queryFn: () => homeCareApi.services(zone ? { zone } : undefined),
    enabled: userQuery.data?.role === "patient",
  });

  const services = useMemo(() => servicesQuery.data?.results ?? [], [servicesQuery.data?.results]);
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? null,
    [selectedServiceId, services],
  );

  const nursesQuery = useQuery({
    queryKey: ["home-care", "available-nurses", zone, selectedServiceId],
    queryFn: () =>
      homeCareApi.availableNurses({
        page_size: 50,
        zone: zone || undefined,
        service_id: typeof selectedServiceId === "number" ? selectedServiceId : undefined,
      }),
    enabled: userQuery.data?.role === "patient" && Boolean(zone && selectedServiceId),
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
  const effectiveContactName = contactName || userQuery.data?.full_name || profileQuery.data?.full_name || "";
  const effectiveContactPhone = contactPhone || userQuery.data?.phone || profileQuery.data?.phone || "";
  const effectiveAddress = address || profileQuery.data?.address || "";
  const canSubmit = Boolean(zone && selectedService && effectiveContactName.trim() && effectiveContactPhone.trim() && effectiveAddress.trim() && preferredTime);

  return (
    <Section
      title="Home Care"
      action={
        <Link href="/home-care/requests" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
          View requests
        </Link>
      }
    >
      <form
        className="ct-panel grid gap-4 rounded-[28px] p-5 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          const payload: HomeCareRequestCreate & { callback_url: string } = {
            booking_source: "direct",
            referral: null,
            service: typeof selectedServiceId === "number" ? selectedServiceId : null,
            service_zone: zone,
            preferred_nurse: selectedNurse?.id ?? null,
            contact_name_snapshot: effectiveContactName.trim(),
            contact_phone_snapshot: effectiveContactPhone.trim(),
            service_address_snapshot: effectiveAddress.trim(),
            service_location_notes: landmark.trim(),
            requested_window_start: toIsoOrNull(preferredTime),
            requested_window_end: null,
            care_notes: notes.trim(),
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
            <p className="ct-card-title text-[#1F2937]">Book home care</p>
            {selectedService ? (
              <p className="mt-1 text-sm font-semibold text-[var(--primary)]">
                {selectedService.name} - {formatMoney(selectedService.price)}
              </p>
            ) : null}
          </div>
          <Button type="button" variant="secondary" disabled={!zone || !selectedService} onClick={() => setSelectorOpen(true)}>
            Select nurse
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location" required>
            <select
              value={zone}
              onChange={(event) => {
                setZone(event.target.value as HomeCareZone | "");
                setSelectedServiceId("");
                setSelectedNurse(null);
              }}
              className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937] outline-none transition focus:border-[var(--primary)]"
              required
            >
              <option value="">Select location</option>
              {HOMECARE_ZONES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Service" required>
            <select
              value={selectedServiceId}
              onChange={(event) => {
                setSelectedServiceId(event.target.value ? Number(event.target.value) : "");
                setSelectedNurse(null);
              }}
              className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937] outline-none transition focus:border-[var(--primary)]"
              disabled={!zone || servicesQuery.isLoading}
              required
            >
              <option value="">{zone ? "Choose a service" : "Select location first"}</option>
              {services.map((service: HomeCareService) => (
                <option key={service.id} value={service.id}>
                  {service.name} - {formatMoney(service.price)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {servicesQuery.isError ? (
          <Notice title="We couldn't load services." tone="warning">
            {getFriendlyErrorMessage(servicesQuery.error, "homeCare")}
          </Notice>
        ) : null}

        {selectedService ? (
          <div className="ct-soft-panel rounded-[20px] px-4 py-4">
            <p className="font-semibold text-[#1F2937]">{selectedService.name}</p>
            <p className="mt-1 text-sm text-slate-600">{selectedService.description || "Home care service"}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--primary)]">{formatMoney(selectedService.price)}</p>
          </div>
        ) : null}

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
          <Field label="Contact Name" required>
            <Input value={effectiveContactName} onChange={(event) => setContactName(event.target.value)} placeholder="Full name" required />
          </Field>
          <Field label="Phone Number" required>
            <Input value={effectiveContactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+234..." required />
          </Field>
        </div>

        <Field label="Service Address" required>
          <Textarea value={effectiveAddress} onChange={(event) => setAddress(event.target.value)} rows={3} placeholder="Where should the nurse visit?" required />
        </Field>

        <Field label="Landmark">
          <Textarea value={landmark} onChange={(event) => setLandmark(event.target.value)} rows={3} placeholder="Nearby landmark or access note" />
        </Field>

        <Field label="Preferred Time" required>
          <Input type="datetime-local" value={preferredTime} onChange={(event) => setPreferredTime(event.target.value)} required />
        </Field>

        <Field label="Notes for nurse">
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Optional instructions" />
        </Field>

        <div className="ct-soft-panel rounded-[20px] px-4 py-4">
          <p className="text-sm font-semibold text-[#1F2937]">Review and pay</p>
          <div className="mt-2 grid gap-1 text-sm text-slate-600">
            <span>{zone ? HOMECARE_ZONES.find((item) => item.value === zone)?.label : "Location not selected"}</span>
            <span>{selectedService ? selectedService.name : "Service not selected"}</span>
            <span>{selectedNurse ? selectedNurse.display_name : "System matching"}</span>
            <span>{effectiveAddress || "Address not entered"}</span>
            <span className="font-semibold text-[var(--primary)]">
              {selectedService ? formatMoney(selectedService.price) : "Price appears after service selection"}
            </span>
          </div>
        </div>

        {profileQuery.data && !profileQuery.data.profile_complete ? (
          <Notice title="Complete your profile soon" tone="neutral">
            Your saved profile is missing some details. This booking can continue with the visit details entered here.
          </Notice>
        ) : null}

        <Button type="submit" disabled={createRequest.isPending || !canSubmit}>
          {createRequest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {createRequest.isPending ? "Preparing checkout..." : "Review and pay"}
        </Button>
      </form>

      {selectorOpen ? (
        <div className="fixed inset-0 z-[70] bg-slate-950/40 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <h2 className="ct-card-title text-[#1F2937]">Select nurse</h2>
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
                      actionLabel="Select"
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
