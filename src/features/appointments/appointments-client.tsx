"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  CalendarPlus2,
  CheckCircle2,
  LoaderCircle,
  MessageCircle,
  SendHorizonal,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { appointmentsApi, paymentsApi, profilesApi, triageApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { Appointment, PatientProfile, Payment, ProviderDoctor, TriageConversationResult, TriageProcessingResponse, TriageSeverity } from "@/lib/types/backend";
import type { PaymentInitiation } from "@/lib/types/backend";
import { useFormDraft } from "@/lib/use-form-draft";
import { cn, formatDateTime } from "@/lib/utils";
import { appointmentSchema } from "@/lib/validation/features";

type AppointmentFormValues = z.input<typeof appointmentSchema>;
type AppointmentInput = z.output<typeof appointmentSchema>;
type TriageResultData = TriageConversationResult | TriageProcessingResponse;
const MANUAL_PAYMENT_WAITING_STATUSES = new Set(["awaiting_transfer", "transfer_submitted", "awaiting_manual_verification"]);
const symptomQuickReplies = ["Headache", "Fever", "Cough", "Stomach pain"];
const severityOptions: Array<{ value: TriageSeverity; label: string }> = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

function doctorSpecialtyLabel(doctor: ProviderDoctor) {
  return doctor.specialties?.map((specialty) => specialty.name).filter(Boolean).join(", ") || "General consultation";
}

function isConversationResult(data: TriageResultData | undefined): data is TriageConversationResult {
  return Boolean(data && ("summary_preview" in data || "risk_level" in data || "extracted_symptoms" in data));
}

function readableTriageList(items: unknown[] | undefined) {
  return (items ?? [])
    .flatMap((item) => {
      if (typeof item === "string") return [item];
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return [record.name, record.symptom, record.value, record.label].filter(
          (value): value is string => typeof value === "string" && value.trim().length > 0,
        );
      }
      return [];
    })
    .map((value) => value.trim())
    .filter((value, index, array) => array.indexOf(value) === index);
}

function formatSpecialty(value?: string | null) {
  if (!value) return "General consultation";
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function doctorMatchesSpecialty(doctor: ProviderDoctor, specialty?: string | null) {
  if (!specialty) return false;
  const normalized = specialty.toLowerCase().replace(/[_-]+/g, " ");
  return doctorSpecialtyLabel(doctor).toLowerCase().includes(normalized);
}

function sortRecommendedDoctors(doctors: ProviderDoctor[], specialty?: string | null) {
  return [...doctors].sort((left, right) => {
    const leftScore =
      (doctorMatchesSpecialty(left, specialty) ? 100 : 0) +
      (left.availability_status === "available" ? 40 : 0) +
      (left.rating ?? 0) * 4 -
      (left.active_workload ?? 0);
    const rightScore =
      (doctorMatchesSpecialty(right, specialty) ? 100 : 0) +
      (right.availability_status === "available" ? 40 : 0) +
      (right.rating ?? 0) * 4 -
      (right.active_workload ?? 0);
    return rightScore - leftScore;
  });
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Caretekk Assistant is thinking">
      {[0, 1, 2].map((item) => (
        <span
          key={item}
          className="h-2 w-2 animate-pulse rounded-full bg-[#2563EB]"
          style={{ animationDelay: `${item * 150}ms` }}
        />
      ))}
    </span>
  );
}

function AssistantBubble({ speaker, children }: { speaker: "assistant" | "user"; children: React.ReactNode }) {
  return (
    <div className={cn("ct-rise-in flex items-end gap-2", speaker === "user" ? "justify-end" : "justify-start")}>
      {speaker === "assistant" ? (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-[0_10px_28px_-20px_rgba(37,99,235,0.5)] ring-1 ring-[#DBEAFE]">
          <Bot className="h-5 w-5" />
        </span>
      ) : null}
      <div className={cn("grid max-w-[82%] gap-1 sm:max-w-[70%]", speaker === "user" && "justify-items-end")}>
        <div
          className={cn(
            "rounded-[18px] px-4 py-3 text-sm leading-6 shadow-sm",
            speaker === "user"
              ? "rounded-br-[6px] bg-[#2563EB] text-white"
              : "rounded-bl-[6px] border border-[#DBEAFE] bg-[#EFF6FF] text-slate-700",
          )}
        >
          {children}
        </div>
        <span className="px-1 text-[11px] font-medium text-slate-400">Just now</span>
      </div>
    </div>
  );
}

export function AppointmentsClient() {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const userQuery = useCurrentUser();
  const firstTimeWelcome = searchParams.get("welcome") === "first";
  const [page, setPage] = useState(1);
  const [doctorPickerOpen, setDoctorPickerOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<ProviderDoctor | null>(null);
  const [manualPayment, setManualPayment] = useState<PaymentInitiation | null>(null);
  const [aiSessionId, setAiSessionId] = useState<number | null>(null);
  const [aiConversationId, setAiConversationId] = useState<string | null>(null);
  const [aiSymptomText, setAiSymptomText] = useState("");
  const [aiSubmittedText, setAiSubmittedText] = useState("");
  const [aiSeverity, setAiSeverity] = useState<TriageSeverity | null>(null);
  const [aiResultRequested, setAiResultRequested] = useState(false);
  const [aiStartedByUser, setAiStartedByUser] = useState(false);
  const [welcomeAccepted, setWelcomeAccepted] = useState(!firstTimeWelcome);
  const recommendationOpenedRef = useRef(false);
  const appointments = useQuery({
    queryKey: ["appointments", page],
    queryFn: () => appointmentsApi.list({ page, page_size: 10 }),
  });
  const createAppointment = useMutation({
    mutationFn: appointmentsApi.book,
    onSuccess: async (data) => {
      consultationDraft.clearDraft();
      appointmentDraft.clearDraft();
      paymentDraft.clearDraft();
      form.reset();
      setAiSessionId(null);
      setAiConversationId(null);
      setAiSymptomText("");
      setAiSubmittedText("");
      setAiSeverity(null);
      setAiResultRequested(false);
      setAiStartedByUser(false);
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
  const startConversation = useMutation({
    mutationFn: (id: number) => triageApi.startConversation({ session_id: id }),
    onSuccess: (data) => {
      setAiConversationId(data.conversation.id);
    },
  });
  const startAiSession = useMutation({
    mutationFn: triageApi.start,
    onSuccess: (data) => {
      setAiSessionId(data.id);
      setAiStartedByUser(true);
      startConversation.mutate(data.id);
    },
  });
  const sendAiMessage = useMutation({
    mutationFn: (values: { message: string; severity: TriageSeverity }) =>
      triageApi.sendConversationMessage(aiConversationId as string, {
        session_id: aiSessionId || undefined,
        message: values.message,
        severity: values.severity,
      }),
    onSuccess: () => setAiResultRequested(true),
  });
  const aiResult = useQuery({
    queryKey: ["triage", "consultation-flow", aiConversationId],
    queryFn: () => triageApi.conversationResult(aiConversationId as string),
    enabled: Boolean(aiConversationId) && (sendAiMessage.isSuccess || aiResultRequested),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && "status" in data && data.status === "processing" ? 2500 : false;
    },
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
  const profileIncomplete = Boolean(user?.role === "patient" && patientProfile.data && !patientProfile.data.profile_complete);
  const triageSessionParam = Number(searchParams.get("triage_session"));
  const triageSessionId = Number.isInteger(triageSessionParam) && triageSessionParam > 0 ? triageSessionParam : null;
  const aiResultData = aiResult.data;
  const aiFinished = isConversationResult(aiResultData) && aiResultData.status === "completed";
  const effectiveTriageSessionId = triageSessionId ?? (aiFinished ? aiSessionId : null);
  const suggestedSpecialty = isConversationResult(aiResultData) ? aiResultData.department : null;
  const triageSymptoms = isConversationResult(aiResultData) ? readableTriageList(aiResultData.extracted_symptoms) : [];
  const doctorItems = useMemo(
    () => sortRecommendedDoctors(availableDoctors.data?.results ?? [], suggestedSpecialty),
    [availableDoctors.data?.results, suggestedSpecialty],
  );
  const selectedDoctorLive = selectedDoctor
    ? doctorItems.find((doctor) => doctor.id === selectedDoctor.id) ?? (availableDoctors.isSuccess ? null : selectedDoctor)
    : null;
  const doctorCanBeBooked = selectedDoctorLive?.availability_status === "available";
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
  const consultationDraftValue = useMemo(
    () => ({
      aiSessionId,
      aiConversationId,
      aiSymptomText,
      aiSubmittedText,
      aiSeverity,
      aiResultRequested,
      aiStartedByUser,
    }),
    [aiConversationId, aiResultRequested, aiSessionId, aiSeverity, aiStartedByUser, aiSubmittedText, aiSymptomText],
  );
  const restoreConsultationDraft = useCallback((draft: typeof consultationDraftValue) => {
    setAiSessionId(draft.aiSessionId ?? null);
    setAiConversationId(draft.aiConversationId ?? null);
    setAiSymptomText(draft.aiSymptomText || "");
    setAiSubmittedText(draft.aiSubmittedText || "");
    setAiSeverity(draft.aiSeverity ?? null);
    setAiResultRequested(Boolean(draft.aiResultRequested || draft.aiSeverity));
    setAiStartedByUser(Boolean(draft.aiStartedByUser || draft.aiSessionId || draft.aiConversationId));
    if (draft.aiSessionId || draft.aiConversationId || draft.aiSymptomText || draft.aiSubmittedText) {
      setWelcomeAccepted(true);
    }
  }, []);
  const consultationDraft = useFormDraft({
    key: user?.id ? `caretekk:draft:consultation-ai:${user.id}` : null,
    value: consultationDraftValue,
    enabled: user?.role === "patient" && !createAppointment.isSuccess && !triageSessionId,
    expiresInMs: 24 * 60 * 60 * 1000,
    onRestore: restoreConsultationDraft,
    isSignificant: (draft) =>
      Boolean(draft.aiSessionId || draft.aiConversationId || draft.aiSymptomText.trim() || draft.aiSubmittedText.trim()),
    sanitize: (draft) => ({
      aiSessionId: draft.aiSessionId,
      aiConversationId: draft.aiConversationId,
      aiSymptomText: draft.aiSymptomText,
      aiSubmittedText: draft.aiSubmittedText,
      aiSeverity: draft.aiSeverity,
      aiResultRequested: draft.aiResultRequested,
      aiStartedByUser: draft.aiStartedByUser,
    }),
  });
  const appointmentDraftKey = user?.id ? `caretekk:draft:consultation-booking:${user.id}` : null;
  const appointmentDraftValue = {
    doctor: selectedDoctorLive?.id ?? selectedDoctor?.id ?? watchedAppointment.doctor ?? 0,
    selectedDoctor: selectedDoctorLive ?? selectedDoctor,
    triageSessionId: effectiveTriageSessionId,
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
      triageSessionId: draft.triageSessionId,
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

  useEffect(() => {
    if (!welcomeAccepted || user?.role !== "patient" || profileIncomplete || triageSessionId || aiSessionId || startAiSession.isPending) {
      return;
    }
    startAiSession.mutate();
  }, [aiSessionId, profileIncomplete, startAiSession, triageSessionId, user?.role, welcomeAccepted]);

  useEffect(() => {
    if (!aiFinished || recommendationOpenedRef.current || selectedDoctor) {
      return;
    }
    recommendationOpenedRef.current = true;
    const timer = window.setTimeout(() => setDoctorPickerOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [aiFinished, selectedDoctor]);

  function handleAiSymptomSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const symptom = aiSymptomText.trim();
    if (!symptom || !aiConversationId) return;
    setAiSubmittedText(symptom);
    setAiSymptomText("");
  }

  function handleAiSeveritySelect(severity: TriageSeverity) {
    if (!aiConversationId || !aiSubmittedText || sendAiMessage.isPending) return;
    setAiSeverity(severity);
    sendAiMessage.mutate({ message: aiSubmittedText, severity });
  }

  return (
    <Section
      title={user?.role === "patient" ? "" : isDoctor ? "Consultations" : "Appointments"}
      description={user?.role === "patient" ? "" : isDoctor ? "Open and manage assigned consultations." : undefined}
    >
      {user?.role === "patient" && !effectiveTriageSessionId ? (
        <div className="-mx-4 -mt-5 grid min-h-[calc(100dvh-132px)] gap-5 bg-[linear-gradient(180deg,#F8FBFF_0%,#FFFFFF_42%,#F8FBFF_100%)] px-4 py-4 pb-6 sm:mx-0 sm:mt-0 sm:rounded-[8px] sm:p-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div className="grid content-start gap-4">
                {profileIncomplete ? (
                  <Notice title="Complete your profile before booking" tone="warning">
                    Doctors need your name, phone, date of birth, gender, state, and LGA before consultation.
                    <Link className="ml-2 font-semibold text-amber-800 underline" href="/profile">Update profile</Link>
                  </Notice>
                ) : null}
                {firstTimeWelcome ? (
                  <div className="mx-auto flex w-40 items-center justify-center gap-2 sm:hidden" aria-hidden="true">
                    <span className="h-1.5 w-12 rounded-full bg-[#2563EB]" />
                    <span className="h-1.5 w-12 rounded-full bg-slate-200" />
                    <span className="h-1.5 w-12 rounded-full bg-slate-200" />
                  </div>
                ) : null}
                <div className="grid grid-cols-[minmax(0,1fr)_112px] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_140px]">
                  <div className="min-w-0">
                    <h2 className="font-heading text-[1.75rem] font-semibold leading-tight text-[#1F2937] sm:text-3xl">
                      Hi {user?.full_name?.trim().split(/\s+/)[0] || "there"}! 👋
                    </h2>
                    <p className="mt-1 font-heading text-[1.55rem] font-semibold leading-tight text-[#2563EB] sm:text-2xl">
                      I&apos;m your Caretekk Assistant
                    </p>
                    <p className="mt-3 max-w-sm text-sm leading-7 text-slate-600">
                      {firstTimeWelcome
                        ? "I'll ask a few questions so I can understand how you're feeling and recommend the right doctor for you."
                        : "Tell me how you're feeling today, and I'll recommend the most suitable doctor."}
                    </p>
                  </div>
                  <span className="ct-float-gentle relative flex h-28 w-28 items-center justify-center justify-self-end sm:h-36 sm:w-36">
                    <span className="absolute h-24 w-24 rounded-full bg-[#DBEAFE] sm:h-32 sm:w-32" />
                    <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-[0_18px_42px_-30px_rgba(37,99,235,0.48)] sm:h-20 sm:w-20">
                      <Bot className="h-9 w-9 sm:h-11 sm:w-11" />
                    </span>
                  </span>
                </div>
                {firstTimeWelcome && !welcomeAccepted ? (
                  <Button
                    type="button"
                    className="w-full sm:w-fit"
                    disabled={profileIncomplete}
                    onClick={() => setWelcomeAccepted(true)}
                  >
                    Let&apos;s Get Started
                  </Button>
                ) : null}
                <div className="grid gap-3 rounded-[8px] border border-slate-100 bg-white p-4 shadow-[0_18px_44px_-38px_rgba(15,23,42,0.28)]">
                  <p className="text-sm font-semibold text-[#1F2937]">Here&apos;s how it works:</p>
                  {[
                    { icon: MessageCircle, title: "You tell me how you're feeling", text: "Share your symptoms in your own words." },
                    { icon: BrainCircuit, title: "I analyze your symptoms", text: "Caretekk prepares a care summary for this consultation." },
                    { icon: Stethoscope, title: "I recommend the right doctor", text: "You'll see doctors matched to your needs." },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.title} className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DBEAFE] text-[#2563EB]">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-[#1F2937]">{item.title}</span>
                          <span className="block text-xs leading-5 text-slate-600">{item.text}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex min-h-[58dvh] flex-col gap-4 lg:min-h-[72dvh]">
                <ErrorMessage error={startAiSession.error || startConversation.error || sendAiMessage.error || aiResult.error} context="triage" />
                <div className="grid flex-1 content-start gap-3 overflow-y-auto pr-1">
                  <AssistantBubble speaker="assistant">
                    <p className="font-semibold text-[#1F2937]">
                      {firstTimeWelcome ? "Hi 👋" : "Welcome back 👋"}
                    </p>
                    <p>
                      {firstTimeWelcome
                        ? "I'm your Caretekk Health Assistant. I'll ask you a few questions so I can recommend the right doctor."
                        : "Tell me how you're feeling today, and I'll recommend the most suitable doctor."}
                    </p>
                  </AssistantBubble>

                  {startAiSession.isPending || startConversation.isPending || (aiSessionId && !aiConversationId) ? (
                    <AssistantBubble speaker="assistant">
                      <span className="inline-flex items-center gap-2">
                        <TypingDots />
                        Preparing your consultation check...
                      </span>
                    </AssistantBubble>
                  ) : null}

                  {aiConversationId && !aiSubmittedText ? (
                    <>
                      <AssistantBubble speaker="assistant">
                        {firstTimeWelcome ? "How are you feeling today?" : "What symptoms are you experiencing today?"}
                      </AssistantBubble>
                      <div className="grid gap-2">
                        <p className="text-xs font-semibold text-slate-500">Examples you can try:</p>
                        <div className="flex flex-wrap gap-2">
                          {symptomQuickReplies.map((reply) => (
                            <button
                              key={reply}
                              type="button"
                              onClick={() => setAiSymptomText(reply)}
                              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[#DBEAFE] bg-white px-3 text-xs font-semibold text-[#2563EB] transition hover:bg-[#EFF6FF]"
                            >
                              {reply}
                            </button>
                          ))}
                        </div>
                      </div>
                      <form className="sticky bottom-0 flex min-h-14 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)]" onSubmit={handleAiSymptomSubmit}>
                        <input
                          value={aiSymptomText}
                          onChange={(event) => setAiSymptomText(event.target.value)}
                          placeholder="Type your symptoms here..."
                          className="min-w-0 flex-1 bg-transparent px-2 text-sm text-[#1F2937] outline-none placeholder:text-[#94A3B8]"
                        />
                        <button
                          type="submit"
                          disabled={!aiSymptomText.trim()}
                          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-white transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label="Send symptoms"
                        >
                          <SendHorizonal className="h-5 w-5" />
                        </button>
                      </form>
                    </>
                  ) : null}

                  {aiSubmittedText ? (
                    <AssistantBubble speaker="user">
                      <p>{aiSubmittedText}</p>
                    </AssistantBubble>
                  ) : null}

                  {aiSubmittedText && !aiSeverity ? (
                    <>
                      <AssistantBubble speaker="assistant">How would you describe the severity?</AssistantBubble>
                      <div className="grid gap-2 sm:flex sm:flex-wrap">
                        {severityOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleAiSeveritySelect(option.value)}
                            className="inline-flex min-h-11 items-center justify-center rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1F2937] transition hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : null}

                  {aiSeverity ? (
                    <AssistantBubble speaker="user">
                      {severityOptions.find((option) => option.value === aiSeverity)?.label ?? aiSeverity}
                    </AssistantBubble>
                  ) : null}

                  {sendAiMessage.isPending || aiResult.isLoading || aiResultData?.status === "processing" ? (
                    <AssistantBubble speaker="assistant">
                      <div className="grid gap-2">
                        <span className="inline-flex items-center gap-2 font-semibold text-[#1F2937]">
                          <LoaderCircle className="h-4 w-4 animate-spin" />
                          Understanding your symptoms...
                        </span>
                        <span className="text-slate-600">Looking for possible causes...</span>
                        <span className="text-slate-600">Identifying the most appropriate specialist...</span>
                        <span className="text-slate-600">Finding available doctors...</span>
                      </div>
                    </AssistantBubble>
                  ) : null}

                  {aiFinished && aiResultData ? (
                    <div className="grid gap-3 rounded-[8px] border border-[#DBEAFE] bg-[#EFF6FF]/80 p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#2563EB]" />
                        <div>
                          <p className="font-semibold text-[#1F2937]">Your consultation summary is ready.</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{aiResultData.summary_preview || "Your symptoms have been summarized for the doctor."}</p>
                        </div>
                      </div>
                      <div className="grid gap-2 text-sm text-slate-700">
                        <p><span className="font-semibold text-[#1F2937]">Symptoms:</span> {triageSymptoms.join(", ") || "Shared with assistant"}</p>
                        <p><span className="font-semibold text-[#1F2937]">Suggested specialty:</span> {formatSpecialty(aiResultData.department)}</p>
                        <p><span className="font-semibold text-[#1F2937]">Risk level:</span> {formatSpecialty(aiResultData.risk_level)}</p>
                      </div>
                      <Notice title="This is not a diagnosis" tone="neutral">
                        This assessment helps Caretekk match you with the most appropriate doctor.
                      </Notice>
                      <Button type="button" className="w-full sm:w-fit" onClick={() => setDoctorPickerOpen(true)}>
                        View recommended doctors
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
                  Your conversation is private and secure.
                </div>
              </div>
        </div>
      ) : user?.role === "patient" ? (
        <form
          className="ct-panel grid gap-4 rounded-[8px] p-5 sm:p-6"
          onSubmit={form.handleSubmit((values) =>
            createAppointment.mutate({
              doctor: values.doctor,
              ...(effectiveTriageSessionId ? { triage_session: effectiveTriageSessionId } : {}),
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
          {profileIncomplete ? (
            <Notice title="Complete your profile before booking" tone="warning">
              Doctors need your name, phone, date of birth, gender, state, and LGA before consultation.
              <Link className="ml-2 font-semibold text-amber-800 underline" href="/profile">Update profile</Link>
            </Notice>
          ) : null}
          {effectiveTriageSessionId ? (
            <Notice title="Care check-in ready" tone="success">
              This consultation will include the AI summary you just completed.
            </Notice>
          ) : (
            <Notice title="Care check-in required" tone="warning">
              Please complete a care check before booking this consultation.
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
                  <Link className="ml-2 font-semibold text-[#2563EB] underline" href="/messages">
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

      {user?.role !== "patient" ? (
        <DataList<Appointment>
          data={appointments.data}
          error={appointments.error}
          isLoading={appointments.isLoading}
          errorContext="appointments"
          loadingLabel="Loading your appointments..."
          emptyTitle={isDoctor ? "No consultations yet." : "No appointments yet."}
          empty=""
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
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge value={item.status} />
                  {isDoctor ? (
                    <Link
                      href={`/appointments/${item.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-[8px] bg-[#2563EB] px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5"
                    >
                      View consultation
                    </Link>
                  ) : null}
                </div>
              </div>
            </article>
          )}
        />
      ) : null}

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
