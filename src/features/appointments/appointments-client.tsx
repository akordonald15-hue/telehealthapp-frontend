"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
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

  return (
    <Section
      title="Appointments"
      description="Patients can create appointments. Doctors and admins can view appointments allowed by backend ownership rules."
    >
      {user?.role === "patient" ? (
        <form
          className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4"
          onSubmit={form.handleSubmit((values) =>
            createAppointment.mutate({
              doctor: values.doctor,
              scheduled_at: values.scheduled_at,
              reason: values.reason,
              notes: values.notes,
            }),
          )}
        >
          <ErrorMessage error={createAppointment.error} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Doctor profile ID" error={form.formState.errors.doctor?.message}>
              <Input type="number" min={1} {...form.register("doctor")} />
            </Field>
            <Field label="Scheduled time" error={form.formState.errors.scheduled_at?.message}>
              <Input type="datetime-local" {...form.register("scheduled_at")} />
            </Field>
          </div>
          <Field label="Reason" error={form.formState.errors.reason?.message}>
            <Textarea {...form.register("reason")} />
          </Field>
          <Button className="w-fit" type="submit" disabled={createAppointment.isPending}>
            {createAppointment.isPending ? "Booking..." : "Book appointment"}
          </Button>
        </form>
      ) : null}

      <DataList<Appointment>
        data={appointments.data}
        error={appointments.error}
        isLoading={appointments.isLoading}
        empty="No appointments returned."
        onNext={appointments.data?.next ? () => setPage((current) => current + 1) : undefined}
        onPrevious={appointments.data?.previous ? () => setPage((current) => Math.max(1, current - 1)) : undefined}
        renderItem={(item) => (
          <article key={item.id} className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-zinc-950">{formatDateTime(item.scheduled_at)}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Patient #{item.patient} · Doctor #{item.doctor}
                </p>
                {item.reason ? <p className="mt-2 text-sm text-zinc-600">{item.reason}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={item.status} />
                {item.status !== "cancelled" ? (
                  <Button
                    variant="secondary"
                    onClick={() => cancelAppointment.mutate(item.id)}
                    disabled={cancelAppointment.isPending}
                  >
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
