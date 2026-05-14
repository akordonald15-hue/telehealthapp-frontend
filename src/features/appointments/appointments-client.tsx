"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus2, MessageSquareText, Stethoscope } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProviderPickerCard } from "@/features/providers/provider-picker-card";
import { appointmentsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { appointmentCompanionLabel } from "@/lib/ui/humanize";
import type { Appointment, ProviderDoctor } from "@/lib/types/backend";
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
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
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
    queryKey: ["appointments", "available-doctors", doctorSearch, specialtyFilter],
    queryFn: () =>
      appointmentsApi.availableDoctors({
        page_size: 50,
        search: doctorSearch.trim() || undefined,
        specialty: specialtyFilter.trim() || undefined,
      }),
    enabled: user?.role === "patient",
  });
  const doctorItems = availableDoctors.data?.results ?? [];
  const doctorCanBeBooked = selectedDoctor?.availability_status === "available";

  return (
    <Section
      title={isDoctor ? "Consultations" : "Appointments"}
      description={
        isDoctor
          ? "Review patient consultations, open appointment details, and continue the care conversation."
          : "Book visits, keep up with changes, and see what matters next."
      }
      action={
        user?.role === "patient" ? (
          <div className="rounded-full border border-blue-100 bg-[#EFF6FF] px-4 py-2 text-sm font-semibold text-[#2563EB]">
            Patients can create appointments
          </div>
        ) : isDoctor ? (
          <div className="rounded-full border border-cyan-100 bg-[#ECFEFF] px-4 py-2 text-sm font-semibold text-[#0F766E]">
            Doctor schedule
          </div>
        ) : null
      }
    >
      {user?.role === "patient" ? (
        <form
          className="ct-panel grid gap-4 rounded-[28px] p-5 sm:p-6"
          onSubmit={form.handleSubmit((values) =>
            createAppointment.mutate({
              doctor: values.doctor,
              scheduled_at: values.scheduled_at,
              reason: values.reason,
              notes: values.notes,
              callback_url: `${window.location.origin}/appointments`,
            }),
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
              <CalendarPlus2 className="h-5 w-5" />
            </span>
            <div>
              <p className="ct-card-title text-[#1F2937]">Book a new appointment</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Choose your doctor, pick a time, then continue to secure Paystack checkout for ₦1,000.</p>
            </div>
          </div>
          <ErrorMessage error={createAppointment.error} context="appointments" />
          {createAppointment.isSuccess ? <Notice title="Checkout ready" tone="success">Redirecting you to Paystack. Your appointment is not marked paid until Paystack verifies payment.</Notice> : null}
          <Notice title="Consultation price: ₦1,000" tone="neutral">
            Caretekk confirms the consultation price before checkout. You will only pay through the secure checkout created for this booking.
          </Notice>
          <div className="ct-soft-panel rounded-[18px] px-4 py-3">
            <p className="font-semibold text-[#1F2937]">1. Choose a doctor</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">Available doctors appear first. Unavailable doctors cannot be selected.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Search doctors">
              <Input value={doctorSearch} onChange={(event) => setDoctorSearch(event.target.value)} placeholder="Name, clinic, or specialty" />
            </Field>
            <Field label="Specialty filter">
              <Input value={specialtyFilter} onChange={(event) => setSpecialtyFilter(event.target.value)} placeholder="e.g. cardiology" />
            </Field>
          </div>

          <Field label="Choose doctor" error={form.formState.errors.doctor?.message}>
            {availableDoctors.isLoading ? (
              <div className="grid gap-3 md:grid-cols-2" aria-busy="true" aria-label="Loading available doctors">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
                    <div className="flex gap-3">
                      <div className="h-12 w-12 animate-pulse rounded-[16px] bg-white" />
                      <div className="flex-1">
                        <div className="h-4 w-40 animate-pulse rounded-full bg-slate-200" />
                        <div className="mt-3 h-3 w-28 animate-pulse rounded-full bg-slate-200" />
                      </div>
                    </div>
                    <div className="mt-4 h-10 w-full animate-pulse rounded-[12px] bg-slate-200 sm:w-32" />
                  </div>
                ))}
              </div>
            ) : availableDoctors.isError ? (
              <Notice title="Doctor list could not load." tone="warning">
                Please try again before booking.
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
                      imageUrl={doctor.profile_image_url}
                      status={doctor.availability_status}
                      selected={selected}
                      disabled={!available}
                      primaryDetail={doctor.rating ? `Rating ${doctor.rating.toFixed(1)}` : "Rating pending"}
                      secondaryDetail={doctor.next_available_time ? `Next ${formatDateTime(doctor.next_available_time)}` : "Next time by schedule"}
                      actionLabel="Book Now"
                      onSelect={() => {
                        setSelectedDoctor(doctor);
                        form.setValue("doctor", doctor.id, { shouldValidate: true });
                      }}
                    />
                  );
                })}
              </div>
            ) : (
              <Notice title="No doctors found" tone="neutral">
                Try clearing the search or specialty filter.
              </Notice>
            )}
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="ct-soft-panel md:col-span-2 rounded-[18px] px-4 py-3">
              <p className="font-semibold text-[#1F2937]">2. Add visit details</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Choose a time and briefly describe what you need help with.</p>
            </div>
            <Field label="Selected doctor">
              <Select
                value={selectedDoctor?.id ? String(selectedDoctor.id) : ""}
                onChange={(event) => {
                  const doctor = doctorItems.find((item) => item.id === Number(event.target.value)) ?? null;
                  setSelectedDoctor(doctor);
                  form.setValue("doctor", doctor?.id ?? 0, { shouldValidate: true });
                }}
              >
                <option value="">Choose from the list</option>
                {doctorItems.map((doctor) => (
                  <option key={doctor.id} value={doctor.id} disabled={doctor.availability_status !== "available"}>
                    {doctor.display_name} - {doctor.availability_status.replace(/_/g, " ")}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Scheduled time" error={form.formState.errors.scheduled_at?.message}>
              <Input type="datetime-local" {...form.register("scheduled_at")} />
            </Field>
          </div>
          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <Textarea placeholder="Briefly describe the reason for your visit" {...form.register("reason")} />
          </Field>
          <Button className="w-full sm:w-fit" type="submit" disabled={createAppointment.isPending || !doctorCanBeBooked}>
            {createAppointment.isPending ? "Starting checkout..." : "Book and pay ₦1,000"}
          </Button>
        </form>
      ) : isDoctor ? (
        <Notice title="Doctor consultation queue" tone="neutral">
          This page shows appointments assigned to your doctor profile. Patient booking tools are hidden from doctor accounts.
        </Notice>
      ) : (
        <Notice title="Appointment creation is patient-led" tone="neutral">
          Patients can book visits here, while the care team keeps the schedule up to date.
        </Notice>
      )}

      <DataList<Appointment>
        data={appointments.data}
        error={appointments.error}
        isLoading={appointments.isLoading}
        errorContext="appointments"
        loadingLabel="Loading your appointments..."
        emptyTitle={isDoctor ? "No consultations yet" : "No appointments yet"}
        empty={isDoctor ? "Assigned patient consultations will appear here once patients book care." : "Your appointments will appear here once they are booked."}
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
                <p className="mt-2 text-sm text-slate-600">{appointmentCompanionLabel(user?.role)}</p>
                {item.reason ? <p className="mt-3 text-sm leading-7 text-slate-600">{item.reason}</p> : null}
                {isDoctor ? (
                  <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <span className="inline-flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-[#0F766E]" />
                      Patient details
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <MessageSquareText className="h-4 w-4 text-[#0F766E]" />
                      Consultation #{item.id}
                    </span>
                  </div>
                ) : null}
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
    </Section>
  );
}
