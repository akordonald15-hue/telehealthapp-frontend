"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus2, Star } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { InlineLoader } from "@/components/ui/loaders";
import { Modal } from "@/components/ui/modal";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { BankTransferPaymentPanel } from "@/features/payments/bank-transfer-payment-panel";
import { ProviderPickerCard } from "@/features/providers/provider-picker-card";
import { appointmentsApi, paymentsApi, profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { Appointment, PatientProfile, Payment, ProviderDoctor } from "@/lib/types/backend";
import type { PaymentInitiation } from "@/lib/types/backend";
import { useFormDraft } from "@/lib/use-form-draft";
import { formatDateTime } from "@/lib/utils";
import { appointmentSchema } from "@/lib/validation/features";

type AppointmentFormValues = z.input<typeof appointmentSchema>;
type AppointmentInput = z.output<typeof appointmentSchema>;
const MANUAL_PAYMENT_WAITING_STATUSES = new Set(["awaiting_transfer", "transfer_submitted", "awaiting_manual_verification"]);

function doctorSpecialtyLabel(doctor: ProviderDoctor) {
  return doctor.specialties?.map((specialty) => specialty.name).filter(Boolean).join(", ") || "General consultation";
}

function DoctorRatingForm({ appointment, onRated }: { appointment: Appointment; onRated: () => void }) {
  const [score, setScore] = useState(5);
  const [feedback, setFeedback] = useState("");
  const rating = useMutation({
    mutationFn: () => appointmentsApi.submitRating(appointment.id, { score, feedback: feedback.trim() }),
    onSuccess: onRated,
  });

  if (appointment.status !== "completed" || appointment.rating) {
    return null;
  }

  return (
    <div className="mt-4 rounded-[8px] border border-[#DBEAFE] bg-[#F8FBFF] p-4">
      <p className="text-sm font-semibold text-[#1F2937]">Rate your doctor</p>
      <div className="mt-3 flex flex-wrap items-center gap-2" role="radiogroup" aria-label="Doctor rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-slate-200 bg-white text-amber-500 transition hover:border-amber-200 hover:bg-amber-50"
            onClick={() => setScore(value)}
            aria-checked={score === value}
            role="radio"
          >
            <Star className={score >= value ? "h-5 w-5 fill-current" : "h-5 w-5"} />
          </button>
        ))}
      </div>
      <Textarea
        className="mt-3"
        placeholder="Optional feedback"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
      />
      <ErrorMessage error={rating.error} context="appointments" />
      <Button className="mt-3 w-full sm:w-fit" type="button" disabled={rating.isPending} onClick={() => rating.mutate()}>
        {rating.isPending ? "Submitting..." : "Submit rating"}
      </Button>
    </div>
  );
}

export function AppointmentsClient() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const userQuery = useCurrentUser();
  const [page, setPage] = useState(1);
  const [doctorPickerOpen, setDoctorPickerOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<ProviderDoctor | null>(null);
  const [manualPayment, setManualPayment] = useState<PaymentInitiation | null>(null);
  const appointments = useQuery({
    queryKey: ["appointments", page],
    queryFn: () => appointmentsApi.list({ page, page_size: 10 }),
  });
  const createAppointment = useMutation({
    mutationFn: appointmentsApi.book,
    onSuccess: async (data) => {
      appointmentDraft.clearDraft();
      paymentDraft.clearDraft();
      form.reset();
      setSelectedDoctor(null);
      setDoctorPickerOpen(false);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      if (data.payment.provider === "bank_transfer") {
        setManualPayment(data.payment);
        return;
      }
      const authorizationUrl = data.payment.authorization_url;
      if (authorizationUrl) {
        window.location.assign(authorizationUrl);
      }
    },
  });
  const submitTransfer = useMutation({
    mutationFn: paymentsApi.submitTransfer,
    onSuccess: async () => {
      paymentDraft.clearDraft();
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
  const cancelAppointment = useMutation({
    mutationFn: appointmentsApi.cancel,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
  const handleRatingUpdated = async () => {
    await queryClient.invalidateQueries({ queryKey: ["appointments"] });
    await queryClient.invalidateQueries({ queryKey: ["appointments", "available-doctors"] });
  };
  const form = useForm<AppointmentFormValues, unknown, AppointmentInput>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctor: 0,
      scheduled_at: "",
      reason: "",
      notes: "",
    },
  });
  const user = userQuery.data;
  const isDoctor = user?.role === "doctor";
  const availableDoctors = useQuery({
    queryKey: ["appointments", "available-doctors"],
    queryFn: () => appointmentsApi.availableDoctors({ page_size: 50 }),
    enabled: user?.role === "patient",
  });
  const patientProfile = useQuery({
    queryKey: ["profile", "me", "patient"],
    queryFn: () => profilesApi.me<PatientProfile>(),
    enabled: user?.role === "patient",
  });
  const doctorItems = availableDoctors.data?.results ?? [];
  const selectedDoctorLive = selectedDoctor
    ? doctorItems.find((doctor) => doctor.id === selectedDoctor.id) ?? (availableDoctors.isSuccess ? null : selectedDoctor)
    : null;
  const doctorCanBeBooked = selectedDoctorLive?.availability_status === "available";
  const profileIncomplete = Boolean(user?.role === "patient" && patientProfile.data && !patientProfile.data.profile_complete);
  const triageSessionParam = Number(searchParams.get("triage_session"));
  const triageSessionId = Number.isInteger(triageSessionParam) && triageSessionParam > 0 ? triageSessionParam : null;
  const activeBankTransferPayment =
    manualPayment ?? (createAppointment.data?.payment.provider === "bank_transfer" ? createAppointment.data.payment : null);
  const activePaymentId = activeBankTransferPayment?.payment_id;
  const activePaymentQuery = useQuery({
    queryKey: ["payments", activePaymentId],
    queryFn: () => paymentsApi.detail(activePaymentId as number),
    enabled: user?.role === "patient" && Boolean(activePaymentId),
    refetchInterval: (query) => {
      const payment = query.state.data as Payment | undefined;
      return !payment || MANUAL_PAYMENT_WAITING_STATUSES.has(payment.status) ? 12000 : false;
    },
  });
  const activePaymentStatus = activePaymentQuery.data?.status ?? activeBankTransferPayment?.status;
  const paymentConfirmed = activePaymentStatus === "success";
  const paymentRejected = activePaymentStatus === "rejected";
  const paymentAwaitingVerification = activePaymentStatus === "awaiting_manual_verification" || activePaymentStatus === "transfer_submitted";
  const watchedAppointment = form.watch();
  const appointmentDraftKey = user?.id ? `caretekk:draft:consultation-booking:${user.id}` : null;
  const appointmentDraftValue = {
    doctor: selectedDoctorLive?.id ?? selectedDoctor?.id ?? watchedAppointment.doctor ?? 0,
    selectedDoctor: selectedDoctorLive ?? selectedDoctor,
    scheduled_at: watchedAppointment.scheduled_at ?? "",
    reason: watchedAppointment.reason ?? "",
  };
  const appointmentDraft = useFormDraft({
    key: appointmentDraftKey,
    value: appointmentDraftValue,
    enabled: user?.role === "patient" && !createAppointment.isSuccess,
    expiresInMs: 24 * 60 * 60 * 1000,
    onRestore: (draft) => {
      if (draft.selectedDoctor) {
        setSelectedDoctor(draft.selectedDoctor);
      }
      form.reset({
        doctor: draft.doctor || 0,
        scheduled_at: draft.scheduled_at || "",
        reason: draft.reason || "",
        notes: "",
      });
    },
    isSignificant: (draft) => Boolean(draft.doctor || draft.scheduled_at || draft.reason?.trim()),
    sanitize: (draft) => ({
      doctor: draft.doctor,
      selectedDoctor: draft.selectedDoctor,
      scheduled_at: draft.scheduled_at,
      reason: draft.reason,
    }),
  });
  const paymentDraftKey = user?.id ? `caretekk:draft:bank-transfer:consultation:${user.id}` : null;
  const paymentDraft = useFormDraft({
    key: paymentDraftKey,
    value: manualPayment,
    enabled: user?.role === "patient" && Boolean(manualPayment),
    expiresInMs: 2 * 60 * 60 * 1000,
    onRestore: (draft) => setManualPayment(draft),
    isSignificant: (draft) => Boolean(draft?.provider === "bank_transfer" && draft.bank_transfer),
    sanitize: (draft) => draft,
  });

  useEffect(() => {
    if (!paymentConfirmed) return;
    void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    void queryClient.invalidateQueries({ queryKey: ["payments"] });
  }, [paymentConfirmed, queryClient]);

  return (
    <Section
      title={isDoctor ? "Consultations" : "Appointments"}
      description={user?.role === "patient" ? "" : isDoctor ? "Open and manage assigned consultations." : undefined}
    >
      {user?.role === "patient" ? (
        <form
          className="ct-panel grid gap-4 rounded-[8px] p-5 sm:p-6"
          onSubmit={form.handleSubmit((values) =>
            createAppointment.mutate({
              doctor: values.doctor,
              ...(triageSessionId ? { triage_session: triageSessionId } : {}),
              scheduled_at: values.scheduled_at,
              reason: values.reason,
              notes: "",
              callback_url: `${window.location.origin}/appointments`,
            }),
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#DBEAFE] text-[#2563EB]">
              <CalendarPlus2 className="h-5 w-5" />
            </span>
            <div>
              <p className="ct-card-title text-[#1F2937]">Book Appointment</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">₦2,000 per consultation</p>
            </div>
          </div>
          <ErrorMessage error={createAppointment.error} context="appointments" />
          {appointmentDraft.restored ? (
            <Notice title="Your previous progress was restored." tone="success">
              You can continue this consultation booking or clear the draft.
              <button type="button" className="ml-2 font-semibold underline" onClick={appointmentDraft.clearDraft}>
                Clear draft
              </button>
            </Notice>
          ) : null}
          {profileIncomplete ? (
            <Notice title="Complete your profile before booking" tone="warning">
              Doctors need your name, phone, date of birth, gender, state, and LGA before consultation.
              <Link className="ml-2 font-semibold text-amber-800 underline" href="/profile">Update profile</Link>
            </Notice>
          ) : null}
          {triageSessionId ? (
            <Notice title="Care check-in ready" tone="success">
              This consultation will include the triage summary you just completed.
            </Notice>
          ) : (
            <Notice title="Care check-in required" tone="warning">
              Please complete a care check before booking this consultation. If you just completed one, we&apos;ll use your latest unused check.
              <Link className="ml-2 font-semibold text-amber-800 underline" href="/triage?booking=1">
                Start Care Check
              </Link>
            </Notice>
          )}
          {createAppointment.isSuccess && createAppointment.data.payment.provider !== "bank_transfer" ? (
            <div className="grid gap-3">
              <Notice title="Checkout ready" tone="success">
                Your appointment is saved. Paystack will verify payment before this consultation is marked paid.
              </Notice>
              <InlineLoader label="Preparing secure payment" />
            </div>
          ) : null}
          <div className="rounded-[8px] border border-[#DBEAFE] bg-[#F8FBFF] px-4 py-3 text-sm text-slate-700">
            <span className="font-semibold text-[#1F2937]">Payment method:</span> Secure online payment with Paystack.
          </div>
          {activeBankTransferPayment ? (
            <div className="grid gap-3">
              {paymentDraft.restored ? <Notice title="Your payment details were restored." tone="success" /> : null}
              {paymentConfirmed ? (
                <Notice title="Payment confirmed" tone="success">
                  Your consultation is now active.
                  <Link className="ml-2 font-semibold text-emerald-800 underline" href="/messages">
                    Open Consultation
                  </Link>
                </Notice>
              ) : paymentRejected ? (
                <Notice title="We could not verify your payment." tone="warning">
                  Please contact Caretekk support or resubmit your payment confirmation.
                </Notice>
              ) : paymentAwaitingVerification ? (
                <Notice title="Awaiting verification" tone="neutral">
                  Your payment notification has been received. We&apos;re verifying your transfer.
                </Notice>
              ) : null}
              {!paymentConfirmed ? (
                <BankTransferPaymentPanel
                  payment={{ ...activeBankTransferPayment, status: activePaymentStatus ?? activeBankTransferPayment.status }}
                  isSubmitting={submitTransfer.isPending}
                  submitted={submitTransfer.isSuccess || paymentAwaitingVerification}
                  error={submitTransfer.error ? getFriendlyErrorMessage(submitTransfer.error, "payments") : null}
                  onSubmit={(proofFile) => submitTransfer.mutate({ paymentId: activeBankTransferPayment.payment_id, proofFile })}
                />
              ) : null}
            </div>
          ) : null}
          <Field label="Selected Doctor" error={form.formState.errors.doctor?.message}>
            <div className="grid gap-3">
              {selectedDoctorLive ? (
                <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">{selectedDoctorLive.display_name}</p>
                      <p className="mt-1 text-sm text-slate-600">{doctorSpecialtyLabel(selectedDoctorLive)}</p>
                    </div>
                    <StatusBadge value={selectedDoctorLive.availability_status} />
                  </div>
                </div>
              ) : (
                <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                  No doctor selected.
                </div>
              )}
              <Button type="button" variant="secondary" className="w-full sm:w-fit" onClick={() => setDoctorPickerOpen(true)}>
                Choose Doctor
              </Button>
            </div>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Schedule Time" error={form.formState.errors.scheduled_at?.message}>
              <Input type="datetime-local" {...form.register("scheduled_at")} />
            </Field>
            <div className="hidden md:block" />
          </div>
          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <Textarea placeholder="Why do you need to see a doctor?" {...form.register("reason")} />
          </Field>
          <Button className="w-full sm:w-fit" type="submit" disabled={createAppointment.isPending || !doctorCanBeBooked || profileIncomplete}>
            {createAppointment.isPending
              ? "Starting checkout..."
              : !doctorCanBeBooked
                ? "Choose an available doctor"
                : "Continue to Paystack"}
          </Button>
        </form>
      ) : isDoctor ? (
        <Notice title="Doctor consultation queue" tone="neutral">
          Assigned consultations appear here.
        </Notice>
      ) : (
        <Notice title="Appointments are available to patients." tone="neutral">
          Patients can book visits here.
        </Notice>
      )}

      <DataList<Appointment>
        data={appointments.data}
        error={appointments.error}
        isLoading={appointments.isLoading}
        errorContext="appointments"
        loadingLabel="Loading your appointments..."
        emptyTitle={isDoctor ? "No consultations yet." : "No appointments yet."}
        empty=""
        emptyAction={
          user?.role === "patient" ? (
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex min-h-11 items-center justify-center rounded-[8px] bg-[#2563EB] px-4 text-sm font-semibold text-white"
            >
              Book your first appointment
            </button>
          ) : null
        }
        onNext={appointments.data?.next ? () => setPage((current) => current + 1) : undefined}
        onPrevious={appointments.data?.previous ? () => setPage((current) => Math.max(1, current - 1)) : undefined}
        renderItem={(item) => (
          <article key={item.id} className="rounded-[8px] border border-white/70 bg-white p-5 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.38)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-heading text-xl font-semibold text-[#1F2937]">{formatDateTime(item.scheduled_at)}</p>
                {item.reason ? <p className="mt-3 text-sm leading-7 text-slate-600">{item.reason}</p> : null}
                {item.triage_summary?.symptoms?.length ? (
                  <div className="mt-3 rounded-[8px] border border-[#DBEAFE] bg-[#F8FBFF] px-3 py-2 text-sm text-slate-600">
                    <span className="font-semibold text-[#1F2937]">Care check-in:</span>{" "}
                    {item.triage_summary.symptoms.join(", ")}
                  </div>
                ) : null}
                {user?.role === "patient" && item.rating ? (
                  <p className="mt-3 text-sm font-semibold text-[#1F2937]">Rated {item.rating.score}/5</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={item.status} />
                {isDoctor ? (
                  <Link
                    href={`/appointments/${item.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-[#0F766E] px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                  >
                    View consultation
                  </Link>
                ) : null}
                {user?.role === "patient" && item.status !== "cancelled" ? (
                  <Button variant="secondary" onClick={() => cancelAppointment.mutate(item.id)} disabled={cancelAppointment.isPending}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </div>
            {user?.role === "patient" ? <DoctorRatingForm appointment={item} onRated={handleRatingUpdated} /> : null}
          </article>
        )}
      />

      <Modal
        open={doctorPickerOpen}
        title="Choose doctor"
        description="Select a doctor for this consultation."
        onClose={() => setDoctorPickerOpen(false)}
        size="xl"
      >
        {availableDoctors.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2" aria-busy="true" aria-label="Loading doctors">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                <div className="flex gap-3">
                  <div className="h-12 w-12 animate-pulse rounded-[8px] bg-white" />
                  <div className="flex-1">
                    <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                    <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : availableDoctors.isError ? (
          <Notice title="Doctor list could not load." tone="warning">
            Please try again.
          </Notice>
        ) : doctorItems.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {doctorItems.map((doctor) => {
              const available = doctor.availability_status === "available";
              const selected = selectedDoctor?.id === doctor.id;
              return (
                <ProviderPickerCard
                  key={doctor.id}
                  name={doctor.display_name}
                  subtitle={doctorSpecialtyLabel(doctor)}
                  primaryDetail={doctor.rating ? `${doctor.rating}/5 (${doctor.review_count ?? 0} reviews)` : "New doctor"}
                  secondaryDetail={`${doctor.completed_consultations ?? 0} completed consultations`}
                  imageUrl={doctor.profile_image_url}
                  status={doctor.availability_status}
                  selected={selected}
                  disabled={!available}
                  actionLabel="Select"
                  onSelect={() => {
                    setSelectedDoctor(doctor);
                    form.setValue("doctor", doctor.id, { shouldValidate: true });
                    setDoctorPickerOpen(false);
                  }}
                />
              );
            })}
          </div>
        ) : (
          <Notice title="No doctors available right now." tone="neutral" />
        )}
      </Modal>
    </Section>
  );
}
