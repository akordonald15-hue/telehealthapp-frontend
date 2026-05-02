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
import { Input, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { appointmentCompanionLabel } from "@/lib/ui/humanize";
import type { Appointment } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";
import { appointmentSchema } from "@/lib/validation/features";

type AppointmentFormValues = z.input<typeof appointmentSchema>;
type AppointmentInput = z.output<typeof appointmentSchema>;

export function AppointmentsClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [page, setPage] = useState(1);
  const appointments = useQuery({
    queryKey: ["appointments", page],
    queryFn: () => appointmentsApi.list({ page, page_size: 10 }),
  });
  const createAppointment = useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: async () => {
      form.reset();
      setPage(1);
      await queryClient.invalidateQueries({ queryKey: ["appointments"] });
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
          className="grid gap-4 rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6"
          onSubmit={form.handleSubmit((values) =>
            createAppointment.mutate({
              doctor: values.doctor,
              scheduled_at: values.scheduled_at,
              reason: values.reason,
              notes: values.notes,
            }),
          )}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
              <CalendarPlus2 className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-[#1F2937]">Book a new appointment</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Choose your doctor, pick a time, and tell us what you need help with.</p>
            </div>
          </div>
          <ErrorMessage error={createAppointment.error} context="appointments" />
          {createAppointment.isSuccess ? <Notice title="Appointment booked" tone="success">Your visit has been scheduled and your list is up to date.</Notice> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Doctor profile" error={form.formState.errors.doctor?.message} hint="Enter the number shared with you by the care team.">
              <Input type="number" min={1} placeholder="Enter the number shared with you" {...form.register("doctor")} />
            </Field>
            <Field label="Scheduled time" error={form.formState.errors.scheduled_at?.message}>
              <Input type="datetime-local" {...form.register("scheduled_at")} />
            </Field>
          </div>
          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <Textarea placeholder="Briefly describe the reason for your visit" {...form.register("reason")} />
          </Field>
          <Button className="w-full sm:w-fit" type="submit" disabled={createAppointment.isPending}>
            {createAppointment.isPending ? "Booking..." : "Book appointment"}
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
                      Patient profile #{item.patient}
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
