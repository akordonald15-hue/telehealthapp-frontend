"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { triageApi } from "@/lib/api/endpoints";
import { triageMessageSchema, triageSymptomsSchema } from "@/lib/validation/features";

type TriageSymptomsFormValues = z.input<typeof triageSymptomsSchema>;
type TriageSymptomsInput = z.output<typeof triageSymptomsSchema>;
type TriageMessageFormValues = z.input<typeof triageMessageSchema>;
type TriageMessageInput = z.output<typeof triageMessageSchema>;

export function TriageClient() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const startSession = useMutation({
    mutationFn: triageApi.start,
    onSuccess: (data) => setSessionId(data.id),
  });
  const submitSymptoms = useMutation({
    mutationFn: (values: TriageSymptomsInput) =>
      triageApi.submitSymptoms(sessionId as number, {
        symptoms: values.symptoms
          .split(",")
          .map((symptom) => symptom.trim())
          .filter(Boolean),
        severity: values.severity,
        duration: values.duration,
        age: values.age === "" ? undefined : values.age,
        gender: values.gender,
        location: values.location,
      }),
  });
  const requestAnalyze = useMutation({
    mutationFn: () => triageApi.requestAnalyze(sessionId as number),
  });
  const startConversation = useMutation({
    mutationFn: () => triageApi.startConversation(sessionId ? { session_id: sessionId } : undefined),
    onSuccess: (data) => setConversationId(data.conversation.id),
  });
  const sendMessage = useMutation({
    mutationFn: (values: TriageMessageInput) =>
      triageApi.sendConversationMessage(conversationId as string, {
        session_id: sessionId || undefined,
        message: values.message,
        severity: values.severity,
      }),
  });
  const result = useQuery({
    queryKey: ["triage", "conversation-result", conversationId],
    queryFn: () => triageApi.conversationResult(conversationId as string),
    enabled: Boolean(conversationId),
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && "status" in data && data.status === "processing" ? 3000 : false;
    },
  });
  const symptomsForm = useForm<TriageSymptomsFormValues, unknown, TriageSymptomsInput>({
    resolver: zodResolver(triageSymptomsSchema),
    defaultValues: {
      symptoms: "",
      severity: "moderate",
      duration: "",
      age: "",
      gender: "",
      location: "",
    },
  });
  const messageForm = useForm<TriageMessageFormValues, unknown, TriageMessageInput>({
    resolver: zodResolver(triageMessageSchema),
    defaultValues: {
      message: "",
      severity: "moderate",
    },
  });

  return (
    <Section
      title="AI triage"
      description="The backend returns a medical disclaimer with triage responses and processes analysis asynchronously."
    >
      <div className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4">
        <ErrorMessage error={startSession.error || submitSymptoms.error || requestAnalyze.error} />
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => startSession.mutate()} disabled={startSession.isPending}>
            {startSession.isPending ? "Starting..." : "Start session"}
          </Button>
          {sessionId ? <StatusBadge value={`Session #${sessionId}`} /> : null}
          {startSession.data?.disclaimer ? <span className="text-sm text-zinc-600">{startSession.data.disclaimer}</span> : null}
        </div>
        <form
          className="grid gap-4"
          onSubmit={symptomsForm.handleSubmit((values) => submitSymptoms.mutate(values))}
        >
          <Field label="Symptoms" error={symptomsForm.formState.errors.symptoms?.message} hint="Comma-separated list">
            <Textarea disabled={!sessionId} {...symptomsForm.register("symptoms")} />
          </Field>
          <div className="grid gap-4 md:grid-cols-4">
            <Field label="Severity" error={symptomsForm.formState.errors.severity?.message}>
              <Select disabled={!sessionId} {...symptomsForm.register("severity")}>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </Select>
            </Field>
            <Field label="Duration">
              <Input disabled={!sessionId} {...symptomsForm.register("duration")} />
            </Field>
            <Field label="Age">
              <Input disabled={!sessionId} type="number" min={0} max={120} {...symptomsForm.register("age")} />
            </Field>
            <Field label="Location">
              <Input disabled={!sessionId} {...symptomsForm.register("location")} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={!sessionId || submitSymptoms.isPending}>
              Save symptoms
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={!sessionId || requestAnalyze.isPending}
              onClick={() => requestAnalyze.mutate()}
            >
              Request analysis
            </Button>
          </div>
          {submitSymptoms.data ? (
            <Notice title={`${submitSymptoms.data.symptoms_saved} symptoms saved`} tone="success">
              {submitSymptoms.data.disclaimer}
            </Notice>
          ) : null}
          {requestAnalyze.data ? <Notice title={requestAnalyze.data.status}>{requestAnalyze.data.disclaimer}</Notice> : null}
        </form>
      </div>

      <div className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4">
        <ErrorMessage error={startConversation.error || sendMessage.error || result.error} />
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => startConversation.mutate()} disabled={startConversation.isPending}>
            Start conversation
          </Button>
          {conversationId ? <StatusBadge value={`Conversation ${conversationId}`} /> : null}
        </div>
        <form className="grid gap-4" onSubmit={messageForm.handleSubmit((values) => sendMessage.mutate(values))}>
          <Field label="Message" error={messageForm.formState.errors.message?.message}>
            <Textarea disabled={!conversationId} {...messageForm.register("message")} />
          </Field>
          <Field label="Severity" error={messageForm.formState.errors.severity?.message}>
            <Select disabled={!conversationId} {...messageForm.register("severity")}>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </Select>
          </Field>
          <Button className="w-fit" type="submit" disabled={!conversationId || sendMessage.isPending}>
            Send to triage
          </Button>
        </form>
        {sendMessage.data ? (
          <Notice title={sendMessage.data.status}>
            Result URL: <span className="font-mono">{sendMessage.data.result_url}</span>
          </Notice>
        ) : null}
        {result.data ? (
          <div className="rounded-md bg-stone-50 p-4">
            <p className="font-semibold text-zinc-950">Conversation result</p>
            <pre className="mt-3 max-h-80 overflow-auto text-xs leading-5 text-zinc-700">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
