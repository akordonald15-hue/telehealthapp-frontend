"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, FileText, Loader2, MessageSquareText, Stethoscope, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentsApi, messagingApi, profilesApi, referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { appointmentCompanionLabel } from "@/lib/ui/humanize";
import { formatDateTime } from "@/lib/utils";

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ct-soft-panel rounded-[18px] px-4 py-3">
      <p className="text-sm font-semibold text-[#1F2937]">{label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-slate-600">{value || "Not available"}</p>
    </div>
  );
}

function patientAge(dob?: string | null) {
  if (!dob) return "Not added";
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "Not added";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age > 0 ? `${age}` : "Not added";
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
  const createReferral = useMutation({
    mutationFn: referralsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
  const createCarePlan = useMutation({
    mutationFn: profilesApi.createCarePlan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["care-plans"] });
    },
  });
  const [referralDraft, setReferralDraft] = useState({ referred_to: "", notes: "", status: "draft" });
  const [carePlanDraft, setCarePlanDraft] = useState({
    complaint_summary: "",
    assessment_note: "",
    care_steps: "",
    medications: "",
    lifestyle_advice: "",
    referral_recommendation: "",
    follow_up_date: "",
    warning_signs: "",
  });

  if (userQuery.data?.role !== "doctor" && userQuery.data?.role !== "admin") {
    return (
      <Section title="Consultation detail" description="This view is available for doctor accounts.">
        <Notice title="This consultation workspace is not available for your account." tone="warning" />
      </Section>
    );
  }

  const appointment = appointmentQuery.data;
  const patient = appointment?.patient_profile;

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
        <InlineLoader label="Loading your consultation" />
      ) : appointment ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="ct-panel rounded-[28px] p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#ECFEFF] text-[#0F766E]">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="ct-dashboard-title text-[#1F2937]">Patient consultation</h2>
                  <p className="mt-1 text-sm text-slate-600">{appointmentCompanionLabel(userQuery.data?.role)}</p>
                </div>
                <StatusBadge value={appointment.status} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Scheduled time" value={formatDateTime(appointment.scheduled_at)} />
                <InfoTile label="Patient" value={patient?.display_name || "Patient"} />
                <InfoTile label="Doctor" value={appointment.doctor_profile?.display_name || "Assigned care provider"} />
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

            <div className="ct-panel rounded-[28px] p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#ECFEFF] text-[#0F766E]">
                  <UserRoundCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="ct-card-title text-[#1F2937]">Patient information</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    More patient details will appear here when available.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Name" value={patient?.display_name || "Patient"} />
                <InfoTile label="Age" value={patientAge(patient?.dob)} />
                <InfoTile label="Gender" value={patient?.gender || "Not added"} />
                <InfoTile label="State / LGA" value={[patient?.state, patient?.lga].filter(Boolean).join(" / ") || "Not added"} />
                <InfoTile label="Phone" value={patient?.phone || "Not added"} />
                <InfoTile label="Patient ID" value={appointment.patient} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="ct-panel rounded-[28px] p-6">
              <MessageSquareText className="h-6 w-6 text-[#0F766E]" />
              <h2 className="ct-card-title mt-4 text-[#1F2937]">Message patient</h2>
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

            <div className="ct-panel rounded-[28px] p-6">
              <ClipboardList className="h-6 w-6 text-[#0F766E]" />
              <h2 className="ct-card-title mt-4 text-[#1F2937]">Create referral</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Patient and consultation are linked automatically.</p>
              <form
                className="mt-5 grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  createReferral.mutate({
                    patient: appointment.patient,
                    appointment: appointment.id,
                    referred_to: referralDraft.referred_to,
                    notes: referralDraft.notes,
                    status: referralDraft.status,
                  });
                }}
              >
                <ErrorMessage error={createReferral.error} context="referrals" />
                {createReferral.isSuccess ? <Notice title="Referral saved" tone="success">The referral is linked to this consultation.</Notice> : null}
                <Field label="Patient">
                  <Input value={patient?.display_name || `Patient #${appointment.patient}`} disabled />
                </Field>
                <Field label="Specialty or facility" required>
                  <Input value={referralDraft.referred_to} onChange={(event) => setReferralDraft((draft) => ({ ...draft, referred_to: event.target.value }))} />
                </Field>
                <Field label="Status">
                  <Select value={referralDraft.status} onChange={(event) => setReferralDraft((draft) => ({ ...draft, status: event.target.value }))}>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                  </Select>
                </Field>
                <Field label="Referral notes">
                  <Textarea value={referralDraft.notes} onChange={(event) => setReferralDraft((draft) => ({ ...draft, notes: event.target.value }))} />
                </Field>
                <Button type="submit" disabled={createReferral.isPending || !referralDraft.referred_to.trim()}>
                  {createReferral.isPending ? "Saving..." : "Save referral"}
                </Button>
              </form>
            </div>

            <div className="ct-panel rounded-[28px] p-6">
              <FileText className="h-6 w-6 text-[#0F766E]" />
              <h2 className="ct-card-title mt-4 text-[#1F2937]">Create care plan</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Write a structured follow-up plan for this patient.</p>
              <form
                className="mt-5 grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  createCarePlan.mutate({
                    patient: appointment.patient,
                    appointment: appointment.id,
                    ...carePlanDraft,
                    follow_up_date: carePlanDraft.follow_up_date || null,
                  });
                }}
              >
                <ErrorMessage error={createCarePlan.error} context="records" />
                {createCarePlan.isSuccess ? <Notice title="Care plan saved" tone="success">The patient can view it from Care Plan.</Notice> : null}
                <Field label="Complaint summary">
                  <Textarea value={carePlanDraft.complaint_summary} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, complaint_summary: event.target.value }))} />
                </Field>
                <Field label="Assessment note">
                  <Textarea value={carePlanDraft.assessment_note} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, assessment_note: event.target.value }))} />
                </Field>
                <Field label="Recommended care steps" required>
                  <Textarea value={carePlanDraft.care_steps} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, care_steps: event.target.value }))} />
                </Field>
                <Field label="Medications / instructions">
                  <Textarea value={carePlanDraft.medications} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, medications: event.target.value }))} />
                </Field>
                <Field label="Lifestyle or follow-up advice">
                  <Textarea value={carePlanDraft.lifestyle_advice} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, lifestyle_advice: event.target.value }))} />
                </Field>
                <Field label="Referral recommendation">
                  <Textarea value={carePlanDraft.referral_recommendation} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, referral_recommendation: event.target.value }))} />
                </Field>
                <Field label="Follow-up date">
                  <Input type="date" value={carePlanDraft.follow_up_date} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, follow_up_date: event.target.value }))} />
                </Field>
                <Field label="Warning signs">
                  <Textarea value={carePlanDraft.warning_signs} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, warning_signs: event.target.value }))} />
                </Field>
                <Button type="submit" disabled={createCarePlan.isPending || !carePlanDraft.care_steps.trim()}>
                  {createCarePlan.isPending ? "Saving..." : "Save care plan"}
                </Button>
              </form>
            </div>
          </div>
        </>
      ) : null}
    </Section>
  );
}
