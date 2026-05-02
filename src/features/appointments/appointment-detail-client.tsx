"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, FileText, Loader2, MessageSquareText, Stethoscope, UserRoundCheck } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentsApi, messagingApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { appointmentCompanionLabel } from "@/lib/ui/humanize";
import { formatDateTime } from "@/lib/utils";

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm font-semibold text-[#1F2937]">{label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-slate-600">{value || "Not available"}</p>
    </div>
  );
}

export function AppointmentDetailClient({ appointmentId }: { appointmentId: number }) {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const appointmentQuery = useQuery({
    queryKey: ["appointments", appointmentId],
    queryFn: () => appointmentsApi.detail(appointmentId),
    enabled: userQuery.data?.role === "doctor" || userQuery.data?.role === "admin",
  });
  const createThread = useMutation({
    mutationFn: (patient: number) => messagingApi.createThread({ patient }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  if (userQuery.data?.role !== "doctor" && userQuery.data?.role !== "admin") {
    return (
      <Section title="Consultation detail" description="This view is available for doctor accounts.">
        <Notice title="This consultation workspace is not available for your account." tone="warning" />
      </Section>
    );
  }

  const appointment = appointmentQuery.data;

  return (
    <Section
      title={appointment ? `Consultation #${appointment.id}` : "Consultation detail"}
      description="Review patient context, consultation status, message access, and follow-up options."
      action={<Link href="/appointments" className="text-sm font-semibold text-[#0F766E]">Back to consultations</Link>}
    >
      {appointmentQuery.isError ? (
        <Notice title="We couldn't load this consultation." tone="warning">
          {getFriendlyErrorMessage(appointmentQuery.error, "appointments")}
        </Notice>
      ) : null}

      {appointmentQuery.isLoading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white px-5 py-10 text-sm text-slate-600">Loading consultation...</div>
      ) : appointment ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#ECFEFF] text-[#0F766E]">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-heading text-2xl font-semibold text-[#1F2937]">Patient consultation</h2>
                  <p className="mt-1 text-sm text-slate-600">{appointmentCompanionLabel(userQuery.data?.role)}</p>
                </div>
                <StatusBadge value={appointment.status} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Scheduled time" value={formatDateTime(appointment.scheduled_at)} />
                <InfoTile label="Patient profile" value={`#${appointment.patient}`} />
                <InfoTile label="Doctor profile" value={`#${appointment.doctor}`} />
                <InfoTile label="Consultation status" value={appointment.status} />
              </div>

              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-[#1F2937]">Reason for visit</p>
                <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {appointment.reason || "No reason was provided for this appointment."}
                </p>
              </div>

              {appointment.notes ? (
                <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-[#1F2937]">Consultation notes</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">{appointment.notes}</p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#ECFEFF] text-[#0F766E]">
                  <UserRoundCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">Patient information</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    The current appointment endpoint exposes patient profile ID and appointment context. Expanded patient demographics can be added when a patient summary endpoint is exposed.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <InfoTile label="Patient profile ID" value={`#${appointment.patient}`} />
                <InfoTile label="Care-plan entry point" value="Open records or referrals for follow-up context." />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <MessageSquareText className="h-6 w-6 text-[#0F766E]" />
              <h2 className="font-heading mt-4 text-xl font-semibold text-[#1F2937]">Message patient</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Create or open a patient conversation for follow-up questions and care instructions.</p>
              <ErrorMessage error={createThread.error} context="messages" />
              {createThread.isSuccess ? (
                <Notice title="Conversation ready" tone="success">
                  Open messages to continue the consultation.
                </Notice>
              ) : null}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row xl:flex-col">
                <Button onClick={() => createThread.mutate(appointment.patient)} disabled={createThread.isPending}>
                  {createThread.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquareText className="mr-2 h-4 w-4" />}
                  Prepare message thread
                </Button>
                <Link href="/messages" className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#1F2937] transition hover:border-cyan-100 hover:bg-cyan-50">
                  Open messages
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <ClipboardList className="h-6 w-6 text-[#0F766E]" />
              <h2 className="font-heading mt-4 text-xl font-semibold text-[#1F2937]">Create referral</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Create specialist referrals or recommend home-care nursing from the referrals workspace.</p>
              <Link href="/referrals" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[#0F766E] px-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5">
                Create referral
              </Link>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <FileText className="h-6 w-6 text-[#0F766E]" />
              <h2 className="font-heading mt-4 text-xl font-semibold text-[#1F2937]">Review care plan</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Review patient records and care-plan context before adding follow-up guidance.</p>
              <Link href="/records" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#1F2937] transition hover:border-cyan-100 hover:bg-cyan-50">
                Open records
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </Section>
  );
}
