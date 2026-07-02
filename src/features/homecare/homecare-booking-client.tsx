"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { BankTransferPaymentPanel } from "@/features/payments/bank-transfer-payment-panel";
import { ProviderPickerCard } from "@/features/providers/provider-picker-card";
import { homeCareApi, paymentsApi, profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { HomeCareRequestCreate, HomeCareService, HomeCareZone, PatientProfile, PaymentInitiation, ProviderNurse } from "@/lib/types/backend";
import { useFormDraft } from "@/lib/use-form-draft";
import { formatMoney } from "@/lib/utils";

const HOMECARE_ZONES: Array<{ value: HomeCareZone; label: string }> = [
  { value: "eket", label: "Eket" },
  { value: "uyo", label: "Uyo" },
];

const HOMECARE_BOTTOM_SAFE_PADDING = "pb-[calc(9rem+env(safe-area-inset-bottom))] sm:pb-[calc(7rem+env(safe-area-inset-bottom))] lg:pb-8";

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
  const [assignmentMode, setAssignmentMode] = useState<"auto" | "choose">("auto");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [manualPayment, setManualPayment] = useState<PaymentInitiation | null>(null);

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
      homecareDraft.clearDraft();
      paymentDraft.clearDraft();
      if (response.payment.provider === "bank_transfer") {
        setManualPayment(response.payment);
        return;
      }
      if (response.payment.authorization_url) {
        window.location.assign(response.payment.authorization_url);
        return;
      }
      router.replace(`/home-care/requests/${response.request.id}`);
    },
  });
  const submitTransfer = useMutation({
    mutationFn: paymentsApi.submitTransfer,
    onSuccess: (payment) => {
      paymentDraft.clearDraft();
      setManualPayment(payment);
    },
  });

  const nurseItems = nursesQuery.data?.results ?? [];
  const effectiveContactName = contactName || userQuery.data?.full_name || profileQuery.data?.full_name || "";
  const effectiveContactPhone = contactPhone || userQuery.data?.phone || profileQuery.data?.phone || "";
  const effectiveAddress = address || profileQuery.data?.address || "";
  const canSubmit = Boolean(
    zone &&
      selectedService &&
      effectiveContactName.trim() &&
      effectiveContactPhone.trim() &&
      effectiveAddress.trim() &&
      preferredTime &&
      (assignmentMode === "auto" || selectedNurse),
  );
  const homecareDraftValue = useMemo(
    () => ({
      zone,
      selectedServiceId,
      contactName,
      contactPhone,
      address,
      landmark,
      preferredTime,
      notes,
      selectedNurse,
      assignmentMode,
    }),
    [address, assignmentMode, contactName, contactPhone, landmark, notes, preferredTime, selectedNurse, selectedServiceId, zone],
  );
  const restoreHomecareDraft = useCallback((draft: typeof homecareDraftValue) => {
    setZone(draft.zone || "");
    setSelectedServiceId(draft.selectedServiceId || "");
    setContactName(draft.contactName || "");
    setContactPhone(draft.contactPhone || "");
    setAddress(draft.address || "");
    setLandmark(draft.landmark || "");
    setPreferredTime(draft.preferredTime || "");
    setNotes(draft.notes || "");
    setSelectedNurse(draft.selectedNurse || null);
    setAssignmentMode(draft.assignmentMode || "auto");
  }, []);
  const draftUserId = userQuery.data?.id;
  const homecareDraft = useFormDraft({
    key: draftUserId ? `caretekk:draft:homecare-booking:${draftUserId}` : null,
    value: homecareDraftValue,
    enabled: userQuery.data?.role === "patient" && !manualPayment,
    expiresInMs: 24 * 60 * 60 * 1000,
    onRestore: restoreHomecareDraft,
    isSignificant: (draft) =>
      Boolean(
        draft.zone ||
          draft.selectedServiceId ||
          draft.contactName.trim() ||
          draft.contactPhone.trim() ||
          draft.address.trim() ||
          draft.landmark.trim() ||
          draft.preferredTime ||
          draft.notes.trim() ||
          draft.selectedNurse,
      ),
    sanitize: (draft) => ({
      zone: draft.zone,
      selectedServiceId: draft.selectedServiceId,
      contactName: draft.contactName,
      contactPhone: draft.contactPhone,
      address: draft.address,
      landmark: draft.landmark,
      preferredTime: draft.preferredTime,
      notes: draft.notes,
      selectedNurse: draft.selectedNurse,
      assignmentMode: draft.assignmentMode,
    }),
  });
  const paymentDraft = useFormDraft({
    key: draftUserId ? `caretekk:draft:bank-transfer:homecare:${draftUserId}` : null,
    value: manualPayment,
    enabled: userQuery.data?.role === "patient" && Boolean(manualPayment),
    expiresInMs: 2 * 60 * 60 * 1000,
    onRestore: (draft) => setManualPayment(draft),
    isSignificant: (draft) => Boolean(draft?.provider === "bank_transfer" && draft.bank_transfer),
    sanitize: (draft) => draft,
  });

  if (userQuery.data?.role !== "patient") {
    return (
      <Section title="Home Care" description="Home care is available for patient accounts.">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

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
        className={`ct-panel grid gap-4 rounded-[28px] p-5 sm:p-6 ${HOMECARE_BOTTOM_SAFE_PADDING}`}
        onSubmit={(event) => {
          event.preventDefault();
          const payload: HomeCareRequestCreate & { callback_url: string } = {
            booking_source: "direct",
            referral: null,
            service: typeof selectedServiceId === "number" ? selectedServiceId : null,
            service_zone: zone,
            preferred_nurse: assignmentMode === "choose" ? selectedNurse?.id ?? null : null,
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
        {homecareDraft.restored ? (
          <Notice title="Your previous progress was restored." tone="success">
            You can continue this home care booking or clear the draft.
            <button type="button" className="ml-2 font-semibold underline" onClick={homecareDraft.clearDraft}>
              Clear draft
            </button>
          </Notice>
        ) : null}
        {manualPayment ? (
          <div className="grid gap-3">
            {paymentDraft.restored ? <Notice title="Your payment details were restored." tone="success" /> : null}
            <BankTransferPaymentPanel
              payment={manualPayment}
              isSubmitting={submitTransfer.isPending}
              submitted={submitTransfer.isSuccess || manualPayment.status === "awaiting_manual_verification"}
              error={submitTransfer.error ? getFriendlyErrorMessage(submitTransfer.error, "payments") : null}
              onSubmit={(proofFile) => submitTransfer.mutate({ paymentId: manualPayment.payment_id, proofFile })}
            />
          </div>
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
            Choose nurse
          </Button>
        </div>

        <div className="rounded-[8px] border border-[#DBEAFE] bg-[#F8FBFF] px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-[#1F2937]">Payment method:</span> Secure online payment with Paystack.
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

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={[
              "rounded-[18px] border px-4 py-4 text-left transition",
              assignmentMode === "auto" ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-slate-200 bg-slate-50",
            ].join(" ")}
            onClick={() => {
              setAssignmentMode("auto");
              setSelectedNurse(null);
            }}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
              <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
              Assign any available nurse
            </span>
            <span className="mt-1 block text-sm text-slate-600">Recommended. Caretekk matches by availability, service, zone, and workload.</span>
          </button>
          <button
            type="button"
            className={[
              "rounded-[18px] border px-4 py-4 text-left transition",
              assignmentMode === "choose" ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-slate-200 bg-slate-50",
            ].join(" ")}
            onClick={() => {
              setAssignmentMode("choose");
              setSelectorOpen(Boolean(zone && selectedService));
            }}
          >
            <span className="text-sm font-semibold text-[#1F2937]">Choose nurse</span>
            <span className="mt-1 block text-sm text-slate-600">{selectedNurse ? selectedNurse.display_name : "Select from available nurses."}</span>
          </button>
        </div>

        {assignmentMode === "choose" && selectedNurse ? (
          <div className="ct-soft-panel flex items-center justify-between gap-3 rounded-[20px] px-4 py-4">
            <div>
              <p className="font-semibold text-[#1F2937]">{selectedNurse.display_name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedNurse.rating ? `Star ${selectedNurse.rating} (${selectedNurse.review_count ?? 0} reviews)` : "No reviews yet"}
                {selectedNurse.completed_visits !== undefined ? ` · ${selectedNurse.completed_visits} completed visits` : ""}
              </p>
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
            <span>{assignmentMode === "choose" && selectedNurse ? selectedNurse.display_name : "Assign any available nurse"}</span>
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
          {createRequest.isPending ? "Preparing checkout..." : "Continue to Paystack"}
        </Button>
      </form>

      <Modal
        open={selectorOpen}
        title="Select nurse"
        description="Choose an available nurse assigned to your selected location."
        onClose={() => setSelectorOpen(false)}
        size="xl"
        closeLabel="Close nurse selector"
        bodyClassName="pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:pb-6"
      >
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
                primaryDetail={nurse.rating ? `Star ${nurse.rating} (${nurse.review_count ?? 0} reviews)` : "No reviews yet"}
                secondaryDetail={`${nurse.completed_visits ?? 0} completed visits`}
                actionLabel="Select"
                onSelect={() => {
                  setAssignmentMode("choose");
                  setSelectedNurse(nurse);
                  setSelectorOpen(false);
                }}
              />
            ))}
          </div>
        ) : (
          <EmptyHomeCareNurseState zoneLabel={HOMECARE_ZONES.find((item) => item.value === zone)?.label} />
        )}
      </Modal>
    </Section>
  );
}

function EmptyHomeCareNurseState({ zoneLabel }: { zoneLabel?: string }) {
  return (
    <div className="ct-surface rounded-[24px] p-6 text-center">
      <Home className="mx-auto h-6 w-6 text-[var(--primary)]" />
      <p className="mt-3 font-semibold text-[#1F2937]">No available nurse in this location right now.</p>
      <p className="mt-1 text-sm text-slate-600">
        {zoneLabel ? `Caretekk will only show nurses assigned to ${zoneLabel}.` : "Select a location to see matching nurses."}
      </p>
    </div>
  );
}
