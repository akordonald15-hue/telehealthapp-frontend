"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { BankTransferPaymentPanel } from "@/features/payments/bank-transfer-payment-panel";
import { ProviderPickerCard } from "@/features/providers/provider-picker-card";
import { ApiError, extractErrorMessage } from "@/lib/api/client";
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

function todayDateValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function slotTimestamp(value: string) {
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

function isValidHourlyHomecareSlot(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return false;
  }
  const hour = date.getHours();
  return hour >= 8 && hour <= 19 && date.getMinutes() === 0 && date.getSeconds() === 0;
}

export function HomeCareBookingClient() {
  const userQuery = useCurrentUser();
  const [zone, setZone] = useState<HomeCareZone | "">("");
  const [selectedServiceId, setSelectedServiceId] = useState<number | "">("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [preferredDate, setPreferredDate] = useState(todayDateValue);
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedNurse, setSelectedNurse] = useState<ProviderNurse | null>(null);
  const [assignmentMode, setAssignmentMode] = useState<"auto" | "choose">("auto");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [manualPayment, setManualPayment] = useState<PaymentInitiation | null>(null);
  const [checkoutError, setCheckoutError] = useState("");

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

  const slotsQuery = useQuery({
    queryKey: ["home-care", "available-slots", selectedNurse?.id, preferredDate],
    queryFn: async () => {
      const query = { nurse_id: selectedNurse?.id as number, date: preferredDate };
      if (process.env.NODE_ENV !== "production") {
        console.info("Caretekk home care slots request", {
          nurseId: selectedNurse?.id ?? null,
          serviceId: selectedServiceId || null,
          visitDate: preferredDate,
          location: zone || null,
          slotsApiUrl: `/home-care/available-slots/?nurse_id=${query.nurse_id}&date=${query.date}`,
          query,
        });
      }
      const response = await homeCareApi.availableSlots(query);
      if (process.env.NODE_ENV !== "production") {
        console.info("Caretekk home care slots response", {
          nurseId: query.nurse_id,
          visitDate: query.date,
          count: response.results.length,
          response,
        });
      }
      return response;
    },
    enabled: userQuery.data?.role === "patient" && Boolean(selectedNurse?.id && preferredDate),
  });

  const createRequest = useMutation({
    mutationFn: (body: HomeCareRequestCreate & { callback_url: string }) => homeCareApi.bookRequest(body),
    onMutate: () => {
      setCheckoutError("");
    },
    onSuccess: (response) => {
      if (process.env.NODE_ENV !== "production") {
        console.info("Caretekk home care checkout response", {
          payment: response.payment,
          request: response.request,
          authorizationUrl: response.payment.authorization_url,
          finalNavigationDecision: response.payment.authorization_url ? "open_paystack" : response.payment.provider === "bank_transfer" ? "show_bank_transfer" : "show_error",
        });
      }
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
      setCheckoutError("Unable to start payment. Please try again.");
    },
    onError: (error) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("Caretekk home care checkout failed", error);
      }
      const backendMessage = error instanceof ApiError ? extractErrorMessage(error.payload) : "";
      setCheckoutError(backendMessage || getFriendlyErrorMessage(error, "paymentCheckout"));
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
  const slotItems = useMemo(() => slotsQuery.data?.results ?? [], [slotsQuery.data?.results]);
  const selectedSlot = useMemo(() => {
    const selectedTime = slotTimestamp(preferredTime);
    if (selectedTime === null) {
      return null;
    }
    return slotItems.find((slot) => slotTimestamp(slot.starts_at) === selectedTime) ?? null;
  }, [preferredTime, slotItems]);
  const effectiveContactName = contactName || userQuery.data?.full_name || profileQuery.data?.full_name || "";
  const effectiveContactPhone = contactPhone || userQuery.data?.phone || profileQuery.data?.phone || "";
  const effectiveAddress = address || profileQuery.data?.address || "";

  useEffect(() => {
    if (!slotsQuery.isError || process.env.NODE_ENV === "production") {
      return;
    }
    console.error("Caretekk home care slots failed", {
      nurseId: selectedNurse?.id ?? null,
      serviceId: selectedServiceId || null,
      visitDate: preferredDate,
      location: zone || null,
      slotsApiUrl: selectedNurse?.id ? `/home-care/available-slots/?nurse_id=${selectedNurse.id}&date=${preferredDate}` : null,
      error: slotsQuery.error,
    });
  }, [preferredDate, selectedNurse?.id, selectedServiceId, slotsQuery.error, slotsQuery.isError, zone]);
  const bookingValidation = useMemo(() => {
    const reasons: string[] = [];
    if (!zone) {
      reasons.push("Select a location.");
    }
    if (!selectedService) {
      reasons.push("Choose a home care service.");
    }
    if (!effectiveContactName.trim()) {
      reasons.push("Enter the contact name.");
    }
    if (!effectiveContactPhone.trim()) {
      reasons.push("Enter the contact phone number.");
    }
    if (!effectiveAddress.trim()) {
      reasons.push("Enter the service address.");
    }
    if (!selectedNurse) {
      reasons.push("Select a nurse.");
    }
    if (!preferredDate) {
      reasons.push("Choose a visit date.");
    }
    if (!preferredTime || !isValidHourlyHomecareSlot(preferredTime)) {
      reasons.push("Choose one of the available hourly time slots.");
    }
    if (selectedNurse && preferredDate && slotsQuery.isError) {
      reasons.push("We couldn't load available time slots. Please try again.");
    }
    if (preferredTime && slotItems.length && (!selectedSlot || !selectedSlot.is_available)) {
      reasons.push("This time slot is no longer available. Please choose another time.");
    }
    if (selectedService && Number(selectedService.price) <= 0) {
      reasons.push("Choose a service with a valid price.");
    }
    return {
      disabledReason: reasons[0] ?? "",
      isFormValid: reasons.length === 0,
      reasons,
    };
  }, [effectiveAddress, effectiveContactName, effectiveContactPhone, preferredDate, preferredTime, selectedNurse, selectedService, selectedSlot, slotItems.length, slotsQuery.isError, zone]);
  const canSubmit = bookingValidation.isFormValid;
  const homecareDraftValue = useMemo(
    () => ({
      zone,
      selectedServiceId,
      contactName,
      contactPhone,
      address,
      landmark,
      preferredDate,
      preferredTime,
      notes,
      selectedNurse,
      assignmentMode,
    }),
    [address, assignmentMode, contactName, contactPhone, landmark, notes, preferredDate, preferredTime, selectedNurse, selectedServiceId, zone],
  );
  const restoreHomecareDraft = useCallback((draft: typeof homecareDraftValue) => {
    setZone(draft.zone || "");
    setSelectedServiceId(draft.selectedServiceId || "");
    setContactName(draft.contactName || "");
    setContactPhone(draft.contactPhone || "");
    setAddress(draft.address || "");
    setLandmark(draft.landmark || "");
    const restoredTime = draft.preferredTime || "";
    if (restoredTime && isValidHourlyHomecareSlot(restoredTime)) {
      const restoredDate = new Date(restoredTime);
      const month = String(restoredDate.getMonth() + 1).padStart(2, "0");
      const day = String(restoredDate.getDate()).padStart(2, "0");
      setPreferredDate(draft.preferredDate || `${restoredDate.getFullYear()}-${month}-${day}`);
      setPreferredTime(restoredTime);
    } else {
      setPreferredDate(draft.preferredDate || todayDateValue());
      setPreferredTime("");
    }
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
          draft.preferredDate ||
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
      preferredDate: draft.preferredDate,
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
            preferred_nurse: selectedNurse?.id ?? null,
            contact_name_snapshot: effectiveContactName.trim(),
            contact_phone_snapshot: effectiveContactPhone.trim(),
            service_address_snapshot: effectiveAddress.trim(),
            service_location_notes: landmark.trim(),
            requested_window_start: selectedSlot?.starts_at ?? preferredTime ?? null,
            requested_window_end: null,
            care_notes: notes.trim(),
            callback_url: `${window.location.origin}/home-care/requests`,
          };
          if (process.env.NODE_ENV !== "production") {
            console.info("Caretekk home care checkout", {
              selectedNurse,
              location: zone,
              service: selectedService,
              address: effectiveAddress,
              date: preferredDate,
              timeSlot: selectedSlot,
              preferredTime,
              availableSlots: slotsQuery.data,
              amount: selectedService?.price ?? null,
              isFormValid: bookingValidation.isFormValid,
              disabledReason: bookingValidation.disabledReason,
              paymentLoading: createRequest.isPending,
              bookingPayload: payload,
            });
          }
          if (!bookingValidation.isFormValid) {
            setCheckoutError(bookingValidation.disabledReason || "Complete the required booking details before continuing.");
            return;
          }
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
                setPreferredTime("");
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
                setPreferredTime("");
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
        {profileQuery.isError ? (
          <Notice title="Saved profile details are temporarily unavailable." tone="neutral">
            You can still continue by entering the visit contact and address below.
          </Notice>
        ) : null}

        {selectedService ? (
          <div className="ct-soft-panel rounded-[20px] px-4 py-4">
            <p className="font-semibold text-[#1F2937]">{selectedService.name}</p>
            <p className="mt-1 text-sm text-slate-600">{selectedService.description || "Home care service"}</p>
            <p className="mt-2 text-sm font-semibold text-[var(--primary)]">{formatMoney(selectedService.price)}</p>
          </div>
        ) : null}

        <button
          type="button"
          className={[
            "rounded-[18px] border px-4 py-4 text-left transition",
            selectedNurse ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-slate-200 bg-slate-50",
          ].join(" ")}
          onClick={() => {
            setAssignmentMode("choose");
            setSelectorOpen(Boolean(zone && selectedService));
            setPreferredTime("");
          }}
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
            <CheckCircle2 className="h-4 w-4 text-[var(--primary)]" />
            {selectedNurse ? selectedNurse.display_name : "Choose nurse"}
          </span>
          <span className="mt-1 block text-sm text-slate-600">
            Select a nurse first so Caretekk can show only that nurse&apos;s available hourly slots.
          </span>
        </button>

        {assignmentMode === "choose" && selectedNurse ? (
          <div className="ct-soft-panel flex items-center justify-between gap-3 rounded-[20px] px-4 py-4">
            <div>
              <p className="font-semibold text-[#1F2937]">{selectedNurse.display_name}</p>
              <p className="mt-1 text-sm text-slate-600">
                {selectedNurse.rating ? `Star ${selectedNurse.rating} (${selectedNurse.review_count ?? 0} reviews)` : "No reviews yet"}
                {selectedNurse.completed_visits !== undefined ? ` · ${selectedNurse.completed_visits} completed visits` : ""}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSelectedNurse(null);
                setPreferredTime("");
              }}
            >
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

        <div className="grid gap-3">
          <Field label="Visit Date" required>
            <Input
              type="date"
              value={preferredDate}
              min={todayDateValue()}
              onChange={(event) => {
                setPreferredDate(event.target.value);
                setPreferredTime("");
              }}
              required
            />
          </Field>
          <div className="rounded-[18px] border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1F2937]">Available hourly slots</p>
                <p className="text-xs text-slate-500">Choose one slot between 8:00 AM and 7:00 PM.</p>
              </div>
              {slotsQuery.isFetching ? <span className="text-xs font-semibold text-[#2563EB]">Refreshing slots...</span> : null}
            </div>
            {!selectedNurse ? (
              <p className="mt-3 rounded-[8px] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-600">Select a nurse to see available times.</p>
            ) : slotsQuery.isError ? (
              <Notice title="We couldn't load available slots." tone="warning">
                Please try again before continuing to Paystack.
                <button
                  type="button"
                  className="ml-2 font-semibold text-[#2563EB] underline"
                  onClick={() => slotsQuery.refetch()}
                >
                  Try again
                </button>
              </Notice>
            ) : slotsQuery.isLoading ? (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-11 animate-pulse rounded-[8px] bg-slate-100" />
                ))}
              </div>
            ) : slotItems.length === 0 ? (
              <p className="mt-3 rounded-[8px] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-600">No slots available for this date.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {slotItems.map((slot) => {
                  const selected = slotTimestamp(slot.starts_at) === slotTimestamp(preferredTime);
                  return (
                    <button
                      key={slot.starts_at}
                      type="button"
                      disabled={!slot.is_available}
                      className={[
                        "min-h-11 rounded-[8px] border px-3 text-sm font-semibold transition",
                        selected ? "border-[#2563EB] bg-[#DBEAFE] text-[#1D4ED8]" : "border-slate-200 bg-white text-[#1F2937]",
                        !slot.is_available ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-400" : "hover:border-[#2563EB]",
                      ].join(" ")}
                      onClick={() => {
                        setPreferredTime(slot.starts_at);
                        setCheckoutError("");
                      }}
                    >
                      {slot.label}
                      {!slot.is_available ? <span className="mt-0.5 block text-[10px] font-semibold">Booked</span> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Field label="Notes for nurse">
          <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} placeholder="Optional instructions" />
        </Field>

        <div className="ct-soft-panel rounded-[20px] px-4 py-4">
          <p className="text-sm font-semibold text-[#1F2937]">Review and pay</p>
          <div className="mt-2 grid gap-1 text-sm text-slate-600">
            <span>{zone ? HOMECARE_ZONES.find((item) => item.value === zone)?.label : "Location not selected"}</span>
            <span>{selectedService ? selectedService.name : "Service not selected"}</span>
            <span>{selectedNurse ? selectedNurse.display_name : "Nurse not selected"}</span>
            <span>{effectiveAddress || "Address not entered"}</span>
            <span>{selectedSlot ? `${preferredDate} at ${selectedSlot.label}` : "Time slot not selected"}</span>
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

        {checkoutError ? (
          <Notice title={checkoutError} tone="warning" />
        ) : null}

        {!canSubmit ? (
          <div className="rounded-[8px] border border-[#DBEAFE] bg-[#F8FBFF] px-4 py-3 text-sm text-slate-700">
            <p className="font-semibold text-[#1F2937]">Complete these details to continue:</p>
            <ul className="mt-2 grid gap-1">
              {bookingValidation.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
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
                status={nurse.availability_status === "available" ? "Available now" : "Offline — schedule for later"}
                selected={selectedNurse?.id === nurse.id}
                primaryDetail={nurse.rating ? `Star ${nurse.rating} (${nurse.review_count ?? 0} reviews)` : "No reviews yet"}
                secondaryDetail={
                  nurse.availability_status === "available"
                    ? `${nurse.completed_visits ?? 0} completed visits`
                    : `Offline - schedule for later | ${nurse.completed_visits ?? 0} completed visits`
                }
                actionLabel="Select"
                onSelect={() => {
                  setAssignmentMode("choose");
                  setSelectedNurse(nurse);
                  setPreferredTime("");
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
