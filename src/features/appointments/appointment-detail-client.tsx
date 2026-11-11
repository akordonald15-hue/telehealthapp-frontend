"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, FileText, Loader2, MessageSquareText, Stethoscope, UserRoundCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { appointmentsApi, messagingApi, profilesApi, referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { appointmentCompanionLabel } from "@/lib/ui/humanize";
import { useFormDraft } from "@/lib/use-form-draft";
import { formatDateTime } from "@/lib/utils";

function InfoTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="ct-soft-panel rounded-[8px] px-4 py-3">
      <p className="text-sm font-semibold text-[#1F2937]">{label}</p>
      <p className="mt-1 break-words text-sm leading-6 text-slate-600">{value || "Not available"}</p>
    </div>
  );
}

function ClinicalNote({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-sm font-semibold text-[#1F2937]">{title}</p>
      <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{children}</div>
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
  const historyAppointments = useQuery({
    queryKey: ["appointments", "patient-history", appointmentId],
    queryFn: () => appointmentsApi.list({ page_size: 50 }),
    enabled: userQuery.data?.role === "doctor",
  });
  const carePlans = useQuery({
    queryKey: ["care-plans", "patient-history", appointmentId],
    queryFn: () => profilesApi.carePlans({ page_size: 50 }),
    enabled: userQuery.data?.role === "doctor",
  });
  const createThread = useMutation({
    mutationFn: (patient: number) => messagingApi.createThread({ patient, appointment_id: appointmentId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });
  const createReferral = useMutation({
    mutationFn: referralsApi.create,
    onSuccess: async () => {
      setReferralDraft({ referred_to: "", notes: "" });
      referralFormDraft.clearDraft();
      await queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
  const createCarePlan = useMutation({
    mutationFn: profilesApi.createCarePlan,
    onSuccess: async () => {
      setCarePlanDraft({ complaint_summary: "", care_plan: "", follow_up_date: "" });
      carePlanFormDraft.clearDraft();
      await queryClient.invalidateQueries({ queryKey: ["care-plans"] });
    },
  });
  const [referralDraft, setReferralDraft] = useState({ referred_to: "", notes: "" });
  const [carePlanDraft, setCarePlanDraft] = useState({
    complaint_summary: "",
    care_plan: "",
    follow_up_date: "",
  });
  const doctorUserId = userQuery.data?.id;
  const referralDraftKey = useMemo(
    () => (doctorUserId ? `caretekk:draft:referral:${appointmentId}:${doctorUserId}` : null),
    [appointmentId, doctorUserId],
  );
  const referralFormDraft = useFormDraft({
    key: referralDraftKey,
    value: referralDraft,
    enabled: userQuery.data?.role === "doctor",
    expiresInMs: 24 * 60 * 60 * 1000,
    onRestore: (draft) => setReferralDraft(draft),
    isSignificant: (draft) => Boolean(draft.referred_to.trim() || draft.notes.trim()),
  });
  const carePlanDraftKey = useMemo(
    () => (doctorUserId ? `caretekk:draft:care-plan:${appointmentId}:${doctorUserId}` : null),
    [appointmentId, doctorUserId],
  );
  const carePlanFormDraft = useFormDraft({
    key: carePlanDraftKey,
    value: carePlanDraft,
    enabled: userQuery.data?.role === "doctor",
    expiresInMs: 24 * 60 * 60 * 1000,
    onRestore: (draft) => setCarePlanDraft(draft),
    isSignificant: (draft) => Boolean(draft.complaint_summary.trim() || draft.care_plan.trim() || draft.follow_up_date),
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
  const previousAppointments = (historyAppointments.data?.results ?? [])
    .filter((item) => item.patient === appointment?.patient && item.id !== appointment?.id)
    .slice(0, 4);
  const patientCarePlans = (carePlans.data?.results ?? [])
    .filter((item) => item.patient === appointment?.patient)
    .slice(0, 4);

  return (
    <Section
      title={appointment ? `Consultation #${appointment.id}` : "Consultation detail"}
      description="Patient context, messaging, care plan, and referral actions."
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
            <div className="ct-panel rounded-[8px] p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#ECFEFF] text-[#0F766E]">
                  <Stethoscope className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-[#1F2937]">Patient consultation</h2>
                  <p className="mt-1 text-sm text-slate-600">{appointmentCompanionLabel(userQuery.data?.role)}</p>
                </div>
                <StatusBadge value={appointment.status} />
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Scheduled time" value={formatDateTime(appointment.scheduled_at)} />
                <InfoTile label="Patient" value={patient?.display_name || "Patient"} />
                <InfoTile label="Doctor" value={appointment.doctor_profile?.display_name || "Assigned care provider"} />
                <InfoTile label="Consultation status" value={appointment.status} />
                <InfoTile label="Consultation fee" value="NGN 2,000" />
                <InfoTile label="Session window" value="20 minutes from first doctor reply" />
              </div>

              <div className="mt-4 grid gap-4">
                <ClinicalNote title="Reason for visit">
                  {appointment.reason || "No reason was provided for this appointment."}
                </ClinicalNote>

                {appointment.notes ? (
                  <ClinicalNote title="Consultation notes">{appointment.notes}</ClinicalNote>
                ) : null}
                {appointment.triage_summary ? (
                  <ClinicalNote title="Consultation triage">
                    <span className="font-semibold text-[#1F2937]">Symptoms:</span>{" "}
                    {appointment.triage_summary.symptoms.join(", ") || "Not recorded"}
                    {"\n"}
                    <span className="font-semibold text-[#1F2937]">Severity:</span>{" "}
                    {appointment.triage_summary.severity || appointment.triage_summary.risk_level || "Not recorded"}
                    {"\n"}
                    <span className="font-semibold text-[#1F2937]">Summary:</span>{" "}
                    {appointment.triage_summary.recommendation || "No summary available."}
                    {"\n\n"}
                    {appointment.triage_summary.disclaimer}
                  </ClinicalNote>
                ) : (
                  <ClinicalNote title="Consultation triage">No triage was provided for this consultation.</ClinicalNote>
                )}
              </div>
            </div>

            <div className="ct-panel rounded-[8px] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[#ECFEFF] text-[#0F766E]">
                  <UserRoundCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="ct-card-title text-[#1F2937]">Patient information</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Key profile details.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoTile label="Name" value={patient?.display_name || "Patient"} />
                <InfoTile label="Age" value={patientAge(patient?.dob)} />
                <InfoTile label="Gender" value={patient?.gender || "Not added"} />
                <InfoTile label="State / LGA" value={[patient?.state, patient?.lga].filter(Boolean).join(" / ") || "Not added"} />
                <InfoTile label="Phone" value={patient?.phone || "Not added"} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <div className="ct-panel rounded-[8px] p-5 sm:p-6">
              <MessageSquareText className="h-6 w-6 text-[#0F766E]" />
              <h2 className="ct-card-title mt-4 text-[#1F2937]">Message patient</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">The 20-minute timer starts when you send the first reply.</p>
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
                <Link href="/messages" className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1F2937] transition hover:border-cyan-100 hover:bg-cyan-50">
                  Open messages
                </Link>
              </div>
            </div>

            <div className="ct-panel rounded-[8px] p-5 sm:p-6">
              <ClipboardList className="h-6 w-6 text-[#0F766E]" />
              <h2 className="ct-card-title mt-4 text-[#1F2937]">Create referral</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Saved to admin review and the patient dashboard.</p>
              <form
                className="mt-5 grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  createReferral.mutate({
                    patient: appointment.patient,
                    appointment: appointment.id,
                    referred_to: referralDraft.referred_to,
                    notes: referralDraft.notes,
                  });
                }}
              >
                <ErrorMessage error={createReferral.error} context="referrals" />
                {referralFormDraft.restored ? (
                  <Notice title="Your previous progress was restored." tone="success">
                    You can continue this referral or clear the draft.
                    <button type="button" className="ml-2 font-semibold underline" onClick={referralFormDraft.clearDraft}>
                      Clear draft
                    </button>
                  </Notice>
                ) : null}
                {createReferral.isSuccess ? <Notice title="Referral saved" tone="success">Patient notification has been queued.</Notice> : null}
                <Field label="Patient">
                  <Input value={patient?.display_name || `Patient #${appointment.patient}`} disabled />
                </Field>
                <Field label="Specialty or facility" required>
                  <Input value={referralDraft.referred_to} onChange={(event) => setReferralDraft((draft) => ({ ...draft, referred_to: event.target.value }))} />
                </Field>
                <Field label="Referral note">
                  <Textarea value={referralDraft.notes} onChange={(event) => setReferralDraft((draft) => ({ ...draft, notes: event.target.value }))} />
                </Field>
                <Button type="submit" disabled={createReferral.isPending || !referralDraft.referred_to.trim()}>
                  {createReferral.isPending ? "Saving..." : "Save referral"}
                </Button>
              </form>
            </div>

            <div className="ct-panel rounded-[8px] p-5 sm:p-6">
              <FileText className="h-6 w-6 text-[#0F766E]" />
              <h2 className="ct-card-title mt-4 text-[#1F2937]">Create care plan</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Keep it concise: complaint, plan, follow-up.</p>
              <form
                className="mt-5 grid gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  createCarePlan.mutate({
                    patient: appointment.patient,
                    appointment: appointment.id,
                    complaint_summary: carePlanDraft.complaint_summary,
                    care_steps: carePlanDraft.care_plan,
                    follow_up_date: carePlanDraft.follow_up_date || null,
                  });
                }}
              >
                <ErrorMessage error={createCarePlan.error} context="records" />
                {carePlanFormDraft.restored ? (
                  <Notice title="Your previous progress was restored." tone="success">
                    You can continue this care plan or clear the draft.
                    <button type="button" className="ml-2 font-semibold underline" onClick={carePlanFormDraft.clearDraft}>
                      Clear draft
                    </button>
                  </Notice>
                ) : null}
                {createCarePlan.isSuccess ? <Notice title="Care plan saved" tone="success">The patient can view it from Care Plan.</Notice> : null}
                <Field label="Complaint summary">
                  <Textarea value={carePlanDraft.complaint_summary} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, complaint_summary: event.target.value }))} />
                </Field>
                <Field label="Care plan / medication instructions" required>
                  <Textarea
                    value={carePlanDraft.care_plan}
                    onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, care_plan: event.target.value }))}
                    placeholder="Medication instructions, self-care advice, warning signs, and next steps."
                    className="min-h-40"
                  />
                </Field>
                <Field label="Follow-up date">
                  <Input type="date" value={carePlanDraft.follow_up_date} onChange={(event) => setCarePlanDraft((draft) => ({ ...draft, follow_up_date: event.target.value }))} />
                </Field>
                <Button type="submit" disabled={createCarePlan.isPending || !carePlanDraft.care_plan.trim()}>
                  {createCarePlan.isPending ? "Saving..." : "Save care plan"}
                </Button>
              </form>
            </div>
          </div>

          <div className="ct-panel rounded-[8px] p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="ct-card-title text-[#1F2937]">Patient history</h2>
                <p className="mt-1 text-sm text-slate-500">Previous complaints, care plans, and follow-ups for this patient.</p>
              </div>
              <UserRoundCheck className="h-5 w-5 text-[#0F766E]" />
            </div>
            {historyAppointments.isLoading || carePlans.isLoading ? (
              <InlineLoader compact label="Loading patient history" />
            ) : previousAppointments.length || patientCarePlans.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="grid gap-3">
                  <p className="text-sm font-semibold text-[#1F2937]">Consultations</p>
                  {previousAppointments.length ? previousAppointments.map((item) => (
                    <div key={item.id} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <p className="break-words text-sm font-semibold text-[#1F2937]">{formatDateTime(item.scheduled_at)}</p>
                        <StatusBadge value={item.status} />
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{item.reason || "No complaint summary added."}</p>
                    </div>
                  )) : <Notice title="No previous consultations" tone="neutral" />}
                </div>
                <div className="grid gap-3">
                  <p className="text-sm font-semibold text-[#1F2937]">Care plans</p>
                  {patientCarePlans.length ? patientCarePlans.map((plan) => (
                    <div key={plan.id} className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
                      <p className="line-clamp-2 text-sm font-semibold text-[#1F2937]">{plan.complaint_summary || "Care plan"}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{plan.care_steps || plan.medications || "No care plan instructions added."}</p>
                      <p className="mt-2 text-sm text-slate-500">Follow-up: {plan.follow_up_date || "Not set"}</p>
                    </div>
                  )) : <Notice title="No care plans yet" tone="neutral" />}
                </div>
              </div>
            ) : (
              <Notice title="No prior history for this patient" tone="neutral" />
            )}
          </div>
        </>
      ) : null}
    </Section>
  );
}
