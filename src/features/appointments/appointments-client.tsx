"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProviderPickerCard } from "@/features/providers/provider-picker-card";
import { appointmentsApi, profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import type { Appointment, PatientProfile, ProviderDoctor } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";
import { appointmentSchema } from "@/lib/validation/features";

type AppointmentFormValues = z.input<typeof appointmentSchema>;
type AppointmentInput = z.output<typeof appointmentSchema>;

function doctorSpecialtyLabel(doctor: ProviderDoctor) {
  return doctor.specialties?.map((specialty) => specialty.name).filter(Boolean).join(", ") || "General consultation";
}

export function AppointmentsClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [page, setPage] = useState(1);
  const [doctorPickerOpen, setDoctorPickerOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<ProviderDoctor | null>(null);
  const appointments = useQuery({
    queryKey: ["appointments", page],
    queryFn: () => appointmentsApi.list({ page, page_size: 10 }),
  });
  const createAppointment = useMutation({
    mutationFn: appointmentsApi.book,
    onSuccess: async (data) => {
      form.reset();
      setSelectedDoctor(null);
      setDoctorPickerOpen(false);
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
      const authorizationUrl = data.payment.authorization_url;
      if (authorizationUrl) {
        window.location.assign(authorizationUrl);
      }
    },
  });
  const cancelAppointment = useMutation({
    mutationFn: appointmentsApi.cancel,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
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
  const doctorCanBeBooked = selectedDoctor?.availability_status === "available";
  const profileIncomplete = Boolean(user?.role === "patient" && patientProfile.data && !patientProfile.data.profile_complete);

  return (
    <Section
      title={isDoctor ? "Consultations" : "Appointments"}
      description={user?.role === "patient" ? "" : isDoctor ? "Open and manage assigned consultations." : undefined}
    >
      {user?.role === "patient" ? (
        <form
          className="ct-panel grid gap-4 rounded-[28px] p-5 sm:p-6"
          onSubmit={form.handleSubmit((values) =>
            createAppointment.mutate({
              doctor: values.doctor,
              scheduled_at: values.scheduled_at,
              reason: values.reason,
              notes: "",
              callback_url: `${window.location.origin}/appointments`,
            }),
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
              <CalendarPlus2 className="h-5 w-5" />
            </span>
            <div>
              <p className="ct-card-title text-[#1F2937]">Book Appointment</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">₦2,000 per consultation</p>
            </div>
          </div>
          <ErrorMessage error={createAppointment.error} context="appointments" />
          {profileIncomplete ? (
            <Notice title="Complete your profile before booking" tone="warning">
              Doctors need your name, phone, date of birth, gender, state, and LGA before consultation.
              <Link className="ml-2 font-semibold text-amber-800 underline" href="/profile">Update profile</Link>
            </Notice>
          ) : null}
          {createAppointment.isSuccess ? (
            <div className="grid gap-3">
              <Notice title="Checkout ready" tone="success">
                Your appointment is saved. Paystack will verify payment before this consultation is marked paid.
              </Notice>
              <InlineLoader label="Preparing secure payment" />
            </div>
          ) : null}
          <Field label="Selected Doctor" error={form.formState.errors.doctor?.message}>
            <div className="grid gap-3">
              {selectedDoctor ? (
                <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1F2937]">{selectedDoctor.display_name}</p>
                      <p className="mt-1 text-sm text-slate-600">{doctorSpecialtyLabel(selectedDoctor)}</p>
                    </div>
                    <StatusBadge value={selectedDoctor.availability_status} />
                  </div>
                </div>
              ) : (
                <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
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
            {createAppointment.isPending ? "Starting checkout..." : "Book Appointment"}
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
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#2563EB] px-4 text-sm font-extrabold text-white"
            >
              Book your first appointment
            </button>
          ) : null
        }
        onNext={appointments.data?.next ? () => setPage((current) => current + 1) : undefined}
        onPrevious={appointments.data?.previous ? () => setPage((current) => Math.max(1, current - 1)) : undefined}
        renderItem={(item) => (
          <article key={item.id} className="rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-heading text-xl font-semibold text-[#1F2937]">{formatDateTime(item.scheduled_at)}</p>
                {item.reason ? <p className="mt-3 text-sm leading-7 text-slate-600">{item.reason}</p> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge value={item.status} />
                {isDoctor ? (
                  <Link
                    href={`/appointments/${item.id}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-[12px] bg-[#0F766E] px-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
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
          </article>
        )}
      />

      {doctorPickerOpen ? (
        <div className="fixed inset-0 z-[70] bg-slate-950/40 px-4 py-8 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="mx-auto w-full max-w-4xl rounded-[28px] bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)] sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="ct-card-title text-[#1F2937]">Choose Doctor</h2>
                <p className="mt-1 text-sm text-slate-600">Select a doctor for this consultation.</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setDoctorPickerOpen(false)}>
                Close
              </Button>
            </div>

            {availableDoctors.isLoading ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2" aria-busy="true" aria-label="Loading doctors">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 animate-pulse rounded-[16px] bg-white" />
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
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {doctorItems.map((doctor) => {
                  const available = doctor.availability_status === "available";
                  const selected = selectedDoctor?.id === doctor.id;
                  return (
                    <ProviderPickerCard
                      key={doctor.id}
                      name={doctor.display_name}
                      subtitle={doctorSpecialtyLabel(doctor)}
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
          </div>
        </div>
      ) : null}
    </Section>
  );
}
