"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  BrainCircuit,
  ClipboardList,
  HeartPulse,
  LoaderCircle,
  Mic,
  SendHorizonal,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ComponentType, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { triageApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import type {
  TriageConversationResult,
  TriageProcessingResponse,
  TriageQuestion,
  TriageSeverity,
} from "@/lib/types/backend";
import { cn } from "@/lib/utils";

type TriageResultData = TriageConversationResult | TriageProcessingResponse;

const severityOptions: Array<{ value: TriageSeverity; label: string }> = [
  { value: "mild", label: "Mild" },
  { value: "moderate", label: "Moderate" },
  { value: "severe", label: "Severe" },
];

function isConversationResult(data: TriageResultData): data is TriageConversationResult {
  return "summary_preview" in data || "risk_level" in data || "extracted_symptoms" in data;
}

function toReadableList(items: unknown[]): string[] {
  return items
    .flatMap((item) => {
      if (typeof item === "string") {
        return [item];
      }
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return [record.name, record.symptom, record.value, record.label]
          .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
          .map((value) => value.trim());
      }
      return [];
    })
    .filter((value, index, array) => array.indexOf(value) === index);
}

function formatDepartment(value?: string | null) {
  if (!value) {
    return "your care team";
  }

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatSeverity(value?: string | null) {
  if (!value) {
    return "Being reviewed";
  }

  const normalized = value.toLowerCase();
  if (normalized === "low") {
    return "Low concern";
  }
  if (normalized === "medium" || normalized === "moderate") {
    return "Moderate concern";
  }
  if (normalized === "high" || normalized === "severe") {
    return "High concern";
  }
  return value;
}

function hasEmergencyFlag(emergency: Record<string, unknown> | null | undefined) {
  if (!emergency) {
    return false;
  }

  return Object.values(emergency).some((value) => value === true || value === "true" || value === "yes");
}

function recommendedAction(data: TriageResultData) {
  if (isConversationResult(data) && hasEmergencyFlag(data.emergency)) {
    return "Please seek urgent medical care right away or contact emergency services if you feel unsafe.";
  }

  if (isConversationResult(data) && data.next_question) {
    return `Answer the next question about ${data.next_question.symptom.toLowerCase()} so we can guide you more clearly.`;
  }

  if (isConversationResult(data) && data.department) {
    return `Follow up with ${formatDepartment(data.department)} for the next step in your care.`;
  }

  if (data.status === "processing") {
    return "We are reviewing your answers and preparing your guidance.";
  }

  return "Keep watching your symptoms and contact your care team if anything changes.";
}

function questionPrompt(question: TriageQuestion | null | undefined) {
  return question?.question_text ?? null;
}

function summaryText(data: TriageResultData) {
  if (isConversationResult(data) && data.summary_preview) {
    return data.summary_preview;
  }

  if (!isConversationResult(data) && data.detail) {
    return data.detail;
  }

  if (data.status === "processing") {
    return "We have your latest answers and are preparing the next update.";
  }

  return "Your latest triage guidance will appear here.";
}

function ResultPanel({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="ct-soft-panel min-w-0 rounded-[22px] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-white text-[#2563EB] shadow-sm">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 break-words">
          <p className="ct-card-title text-[1rem] text-[#1F2937]">{title}</p>
          <div className="mt-2 text-sm leading-7 text-slate-600">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ data }: { data: TriageResultData }) {
  const symptoms = isConversationResult(data) ? toReadableList(data.extracted_symptoms) : [];
  const severity = isConversationResult(data) ? formatSeverity(data.risk_level) : "Being reviewed";
  const nextQuestion = isConversationResult(data) ? questionPrompt(data.next_question) : null;
  const disclaimer = data.disclaimer;

  if (data.status === "processing") {
    return (
      <Notice title="Thanks, let me take a look at that..." tone="neutral">
        <div className="space-y-2">
          <p>{summaryText(data)}</p>
          <p>{recommendedAction(data)}</p>
          {disclaimer ? <p>{disclaimer}</p> : null}
        </div>
      </Notice>
    );
  }

  if (isConversationResult(data) && data.status === "failed") {
    return (
      <Notice title="We could not finish this review" tone="warning">
        <div className="space-y-2">
          <p>{data.error || "Please try again in a moment."}</p>
          {disclaimer ? <p>{disclaimer}</p> : null}
        </div>
      </Notice>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <ResultPanel icon={ClipboardList} title="Summary">
          <p>{summaryText(data)}</p>
        </ResultPanel>
        <ResultPanel icon={AlertTriangle} title="Severity">
          <p>{severity}</p>
        </ResultPanel>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ResultPanel icon={HeartPulse} title="Possible causes">
          {symptoms.length ? (
            <ul className="list-disc space-y-1 pl-5">
              {symptoms.map((symptom) => (
                <li key={symptom}>{symptom}</li>
              ))}
            </ul>
          ) : (
            <p>We are still narrowing this down based on your answers.</p>
          )}
        </ResultPanel>
        <ResultPanel icon={ShieldAlert} title="Recommended action">
          <div className="space-y-2">
            <p>{recommendedAction(data)}</p>
            {nextQuestion ? <p className="font-medium text-[#1F2937]">Next question: {nextQuestion}</p> : null}
          </div>
        </ResultPanel>
      </div>
      {disclaimer ? (
        <Notice title="Medical disclaimer" tone="neutral">
          {disclaimer}
        </Notice>
      ) : null}
    </div>
  );
}

function AssistantBubble({
  speaker,
  children,
}: {
  speaker: "assistant" | "user";
  children: ReactNode;
}) {
  return (
    <div className={cn("flex", speaker === "user" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm sm:max-w-[80%]",
          speaker === "user"
            ? "bg-[linear-gradient(135deg,#2563EB,#60A5FA)] text-white"
            : "border border-slate-200 bg-white text-slate-700",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function TriageClient() {
  const searchParams = useSearchParams();
  const userQuery = useCurrentUser();
  const user = userQuery.data;
  const bookingMode = searchParams.get("booking") === "1";
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [symptomText, setSymptomText] = useState("");
  const [submittedSymptomText, setSubmittedSymptomText] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<TriageSeverity | null>(null);

  const startConversation = useMutation({
    mutationFn: (id: number) => triageApi.startConversation({ session_id: id }),
    onSuccess: (data) => setConversationId(data.conversation.id),
  });

  const startSession = useMutation({
    mutationFn: triageApi.start,
    onSuccess: (data) => {
      setSessionId(data.id);
      startConversation.mutate(data.id);
    },
  });

  const sendMessage = useMutation({
    mutationFn: (values: { message: string; severity: TriageSeverity }) =>
      triageApi.sendConversationMessage(conversationId as string, {
        session_id: sessionId || undefined,
        message: values.message,
        severity: values.severity,
      }),
  });

  const result = useQuery({
    queryKey: ["triage", "conversation-result", conversationId],
    queryFn: () => triageApi.conversationResult(conversationId as string),
    enabled: Boolean(conversationId) && sendMessage.isSuccess,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && "status" in data && data.status === "processing" ? 3000 : false;
    },
  });

  const bootError = startSession.error || startConversation.error;
  const booting = startSession.isPending || startConversation.isPending || (sessionId !== null && !conversationId);
  const waitingForSymptomText = Boolean(conversationId) && !submittedSymptomText;
  const waitingForSeverity = Boolean(conversationId) && Boolean(submittedSymptomText) && !sendMessage.isPending && !sendMessage.isSuccess;
  const processingResult = sendMessage.isPending || result.isLoading || result.data?.status === "processing";
  const resultData = result.data;
  const finishedResult = resultData?.status != null && resultData.status !== "processing";

  const canSubmitSymptomText = symptomText.trim().length > 0 && Boolean(conversationId);

  const assistantOpen = user?.role === "patient" && Boolean(sessionId || conversationId || startSession.isPending);

  function handleSymptomSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmitSymptomText) {
      return;
    }

    setSubmittedSymptomText(symptomText.trim());
    setSymptomText("");
  }

  function handleSeveritySelect(severity: TriageSeverity) {
    if (!conversationId || !submittedSymptomText || sendMessage.isPending) {
      return;
    }

    setSelectedSeverity(severity);
    sendMessage.mutate({ message: submittedSymptomText, severity });
  }

  const nextStepLabel = bookingMode ? "Continue booking" : "Book a consultation";
  const nextStepHref = sessionId ? `/appointments?triage_session=${sessionId}` : "/appointments";
  const pageDescription = bookingMode
    ? "Complete a fresh check-in for this doctor consultation."
    : "Start a new check-in whenever you are preparing for a consultation.";

  return (
    <Section title="Care check-in" description={pageDescription}>
      {userQuery.isLoading ? (
        <div className="ct-panel grid gap-4 rounded-[28px] p-6">
          <InlineLoader label="Preparing your care check-in" />
        </div>
      ) : assistantOpen ? (
        <div className="mx-auto w-full max-w-6xl">
          <div className="ct-surface grid w-full min-w-0 gap-4 rounded-[26px] p-3 sm:rounded-[34px] sm:p-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.85fr)]">
              <div className="ct-panel grid min-w-0 gap-4 rounded-[22px] p-4 sm:rounded-[28px] sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
                    <BrainCircuit className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="ct-card-title text-[#1F2937]">Caretekk Assistant</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">A quick, guided intake before we connect you with care.</p>
                  </div>
                </div>

                <ErrorMessage error={bootError || sendMessage.error || result.error} context="triage" />

                <div className="grid gap-3">
                  <AssistantBubble speaker="assistant">
                    <p className="font-semibold text-[#1F2937]">Hi</p>
                    <p>How are you feeling today?</p>
                  </AssistantBubble>

                  {submittedSymptomText ? (
                    <AssistantBubble speaker="user">
                      <p>{submittedSymptomText}</p>
                    </AssistantBubble>
                  ) : null}

                  {waitingForSeverity || processingResult || finishedResult ? (
                    <AssistantBubble speaker="assistant">
                      <p>How would you describe the severity?</p>
                    </AssistantBubble>
                  ) : null}

                  {selectedSeverity ? (
                    <AssistantBubble speaker="user">
                      <p>{severityOptions.find((option) => option.value === selectedSeverity)?.label ?? selectedSeverity}</p>
                    </AssistantBubble>
                  ) : null}

                  {processingResult ? (
                    <AssistantBubble speaker="assistant">
                      <div className="flex items-center gap-2">
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        <span>Thanks, let me take a look at that...</span>
                      </div>
                    </AssistantBubble>
                  ) : null}
                </div>

                {booting ? (
                  <InlineLoader compact label="Preparing your care check-in" />
                ) : null}

                {startSession.data?.disclaimer && !submittedSymptomText ? (
                  <Notice title="Medical disclaimer" tone="neutral">
                    {startSession.data.disclaimer}
                  </Notice>
                ) : null}

                {waitingForSymptomText ? (
                  <form className="grid gap-3" onSubmit={handleSymptomSubmit}>
                    <div className="grid gap-3">
                      <textarea
                        value={symptomText}
                        onChange={(event) => setSymptomText(event.target.value)}
                        placeholder="Describe what you are feeling in your own words"
                        className="min-h-32 w-full rounded-[18px] border border-[#E5E7EB] bg-white px-4 py-4 text-sm text-[#1F2937] outline-none transition shadow-[0_6px_20px_rgba(31,41,55,0.03)] placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10"
                      />
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                        <button
                          type="button"
                          disabled
                          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400"
                          aria-label="Voice support coming soon"
                          title="Voice support coming soon"
                        >
                          <Mic className="h-4 w-4" />
                        </button>
                        <Button type="submit" disabled={!canSubmitSymptomText} className="min-h-10 w-full rounded-full px-4 sm:w-auto">
                          <SendHorizonal className="mr-2 h-4 w-4" />
                          Continue
                        </Button>
                      </div>
                    </div>
                  </form>
                ) : null}

                {waitingForSeverity ? (
                  <div className="grid gap-3 sm:flex sm:flex-wrap">
                    {severityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSeveritySelect(option.value)}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#D1D5DB] bg-white px-5 text-sm font-bold text-[#1F2937] transition hover:border-[#93C5FD] hover:bg-[#EFF6FF] hover:text-[#2563EB] sm:w-auto"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

            <div className="ct-panel grid min-w-0 gap-4 rounded-[22px] p-4 sm:rounded-[28px] sm:p-6">
              <div>
                <p className="ct-card-title text-[#1F2937]">Your guidance</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Your care summary will appear here.</p>
              </div>

                {finishedResult && resultData ? (
                  <div className="grid gap-4">
                    <ResultCard data={resultData} />
                    <div className="ct-soft-panel rounded-[22px] p-4 sm:p-5">
                      <p className="ct-card-title text-[#1F2937]">Next step</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Your care summary is ready for the doctor, so you can continue the conversation with the right context already in place.
                      </p>
                      <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white/96 p-3 shadow-[0_18px_40px_-34px_rgba(15,23,42,0.18)] sm:flex-row sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
                        <Link
                          href={nextStepHref}
                          className="inline-flex min-h-11 items-center justify-center rounded-[12px] bg-[linear-gradient(135deg,#2563EB,#60A5FA)] px-4 text-sm font-extrabold text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(37,99,235,0.3)]"
                        >
                          {nextStepLabel}
                        </Link>
                        <Link
                          href="/appointments"
                          className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white px-4 text-sm font-extrabold text-[#1F2937] shadow-[0_8px_24px_rgba(31,41,55,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:bg-[#F8FBFF]"
                        >
                          Review appointments
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    <div className="ct-soft-panel rounded-[20px] p-4">
                      <p className="text-sm font-semibold text-[#1F2937]">Summary</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        Tell us how you feel and we&apos;ll prepare a summary.
                      </p>
                    </div>
                    <div className="ct-soft-panel rounded-[20px] p-4">
                      <p className="text-sm font-semibold text-[#1F2937]">Recommended action</p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        We&apos;ll guide you to the next step.
                      </p>
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>
      ) : (
        <div className="ct-panel grid gap-4 rounded-[8px] p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <p className="ct-card-title text-[#1F2937]">
                {bookingMode ? "Prepare your consultation" : "Start a new care check-in"}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Each consultation gets its own symptom summary. Previous check-ins remain attached to their original consultations.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="button"
              onClick={() => startSession.mutate()}
              disabled={startSession.isPending}
              className="w-full sm:w-fit"
            >
              {startSession.isPending ? "Preparing..." : "Start care check-in"}
            </Button>
            <Link
              href="/appointments"
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white px-4 text-sm font-extrabold text-[#1F2937] shadow-[0_8px_24px_rgba(31,41,55,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:bg-[#F8FBFF]"
            >
              Back to appointments
            </Link>
          </div>
        </div>
      )}
    </Section>
  );
}
