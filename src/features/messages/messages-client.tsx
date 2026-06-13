"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Search,
  Send,
  Stethoscope,
  X,
} from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Section } from "@/components/ui/section";
import { messagingApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { buildWebSocketUrl } from "@/lib/realtime";
import type { Message, Thread, UserRole } from "@/lib/types/backend";
import { uploadToPresignedUrl } from "@/lib/api/client";
import { cn } from "@/lib/utils";

type AttachmentPreview = {
  file: File;
  previewUrl: string | null;
};

function participantName(thread: Thread | null, role?: UserRole) {
  if (!thread) {
    return "Consultation";
  }
  if (role === "patient") {
    return thread.doctor_profile?.display_name || `Doctor #${thread.doctor}`;
  }
  if (role === "doctor") {
    return thread.patient_profile?.display_name || `Patient #${thread.patient}`;
  }
  if (role === "admin") {
    return `${thread.patient_profile?.display_name || `Patient #${thread.patient}`} / ${
      thread.doctor_profile?.display_name || `Doctor #${thread.doctor}`
    }`;
  }
  return "Care conversation";
}

function participantRole(thread: Thread | null, role?: UserRole) {
  if (!thread) {
    return "Secure consultation";
  }
  if (role === "patient") {
    return thread.doctor_profile?.specialty || "Doctor";
  }
  if (role === "doctor") {
    return "Patient";
  }
  return "Patient and doctor";
}

function threadPreview(thread: Thread, role?: UserRole, latestMessage?: Message) {
  if (latestMessage?.body) {
    return latestMessage.body;
  }
  if (thread.last_message?.body) {
    return thread.last_message.body;
  }
  if (thread.triage_summary?.symptoms?.length) {
    return `Triage: ${thread.triage_summary.symptoms.join(", ")}`;
  }
  return role === "patient" ? "Your consultation thread is ready." : "Consultation thread is ready.";
}

function relativeThreadTime(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfValue = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfValue) / 86_400_000);
  if (dayDiff === 0) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (dayDiff === 1) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function messageTime(value?: string | null) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatStatus(value?: string | null) {
  if (!value) {
    return "";
  }
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function orderedMessages(messages?: Message[]) {
  return [...(messages ?? [])].sort((a, b) => {
    const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return timeDiff || a.id - b.id;
  });
}

function messageSenderName(message: Message, thread: Thread | null, currentUserId?: number | null, role?: UserRole) {
  if (currentUserId && message.sender === currentUserId) {
    return "You";
  }
  if (!thread) {
    return "Caretekk";
  }
  if (role === "doctor") {
    return thread.patient_profile?.display_name || "Patient";
  }
  if (role === "patient") {
    return thread.doctor_profile?.display_name || "Doctor";
  }
  return "Caretekk";
}

export function MessagesClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const currentUser = userQuery.data;
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [attachment, setAttachment] = useState<AttachmentPreview | null>(null);
  const [disputeReason, setDisputeReason] = useState("need_clarification");
  const [disputeExplanation, setDisputeExplanation] = useState("");
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const [realtimeUnavailable, setRealtimeUnavailable] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  function markRealtimeUnavailable() {
    window.setTimeout(() => {
      setLiveConnected(false);
      setRealtimeUnavailable(true);
    }, 0);
  }

  const threads = useQuery({
    queryKey: ["threads"],
    queryFn: () => messagingApi.threads(),
    refetchInterval: liveConnected ? false : 12000,
  });
  const messages = useQuery({
    queryKey: ["messages", activeThread],
    queryFn: () => messagingApi.messages(activeThread as number),
    enabled: Boolean(activeThread),
    refetchInterval: activeThread && !liveConnected ? 6000 : false,
  });

  const createMessage = useMutation({
    mutationFn: (body: { body: string; attachment_id?: number }) =>
      messagingApi.createMessage(activeThread as number, body),
    onSuccess: async () => {
      setComposerValue("");
      clearAttachment();
      await queryClient.invalidateQueries({ queryKey: ["messages", activeThread] });
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const uploadAttachment = useMutation({
    mutationFn: async (file: File) => {
      if (!activeThread) {
        throw new Error("Choose a consultation first.");
      }

      const uploadInit = await messagingApi.initAttachmentUpload(activeThread, {
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
      });
      await uploadToPresignedUrl(uploadInit.upload_url, file, file.type || "application/octet-stream");
      return uploadInit;
    },
  });

  const endConsultation = useMutation({
    mutationFn: (threadId: number) => messagingApi.endConsultation(threadId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      await queryClient.invalidateQueries({ queryKey: ["messages", activeThread] });
    },
  });

  const createDispute = useMutation({
    mutationFn: (body: { reason_category: string; explanation?: string }) =>
      messagingApi.createDispute(activeThread as number, body),
    onSuccess: async () => {
      setDisputeExplanation("");
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      await queryClient.invalidateQueries({ queryKey: ["messages", activeThread] });
    },
  });

  const threadItems = useMemo(() => threads.data?.results ?? [], [threads.data?.results]);
  const filteredThreads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return threadItems;
    }
    return threadItems.filter((thread) => {
      const haystack = [
        participantName(thread, currentUser?.role),
        participantRole(thread, currentUser?.role),
        thread.last_message?.body,
        thread.triage_summary?.symptoms?.join(" "),
        relativeThreadTime(thread.updated_at || thread.created_at),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [currentUser?.role, search, threadItems]);

  const activeThreadDetails = threadItems.find((thread) => thread.id === activeThread) ?? null;
  const orderedMessageItems = useMemo(() => orderedMessages(messages.data?.results), [messages.data?.results]);
  const latestOrderedMessageId = orderedMessageItems.at(-1)?.id;
  const sectionTitle = currentUser?.role === "patient" ? "Consultation" : "Messages";
  const sectionDescription = "Secure care consultation.";
  const canSendInActiveThread = Boolean(activeThread && activeThreadDetails?.can_send_messages !== false);

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [orderedMessageItems.length, latestOrderedMessageId, activeThread]);

  useEffect(() => {
    return () => {
      if (attachment?.previewUrl) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
    };
  }, [attachment]);

  useEffect(() => {
    if (!activeThread || !currentUser || !["patient", "doctor"].includes(currentUser.role)) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    const wsUrl = buildWebSocketUrl(`/ws/threads/${activeThread}/`);
    if (!wsUrl) {
      markRealtimeUnavailable();
      return;
    }

    let socket: WebSocket;
    let closedByCleanup = false;
    try {
      socket = new WebSocket(wsUrl);
    } catch (error) {
      console.warn("Realtime messaging connection could not be started.", error);
      markRealtimeUnavailable();
      return;
    }
    socketRef.current = socket;

    socket.onopen = () => {
      setLiveConnected(true);
      setRealtimeUnavailable(false);
    };
    socket.onerror = () => {
      setLiveConnected(false);
      setRealtimeUnavailable(true);
    };
    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      setLiveConnected(false);
      if (!closedByCleanup) {
        setRealtimeUnavailable(true);
      }
    };
    socket.onmessage = async () => {
      await queryClient.invalidateQueries({ queryKey: ["messages", activeThread] });
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
    };

    return () => {
      closedByCleanup = true;
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [activeThread, currentUser, queryClient]);

  function selectThread(threadId: number) {
    setLiveConnected(false);
    setRealtimeUnavailable(false);
    setActiveThread(threadId);
    setIsMobileChatOpen(true);
  }

  function clearAttachment() {
    setAttachment((current) => {
      if (current?.previewUrl) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    clearAttachment();
    setAttachment({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeThread || !canSendInActiveThread || createMessage.isPending) {
      return;
    }

    const trimmed = composerValue.trim();
    if (!trimmed && !attachment) {
      return;
    }

    if (attachment) {
      uploadAttachment.mutate(attachment.file, {
        onSuccess: (uploaded) => {
          createMessage.mutate({
            body: trimmed || `Sharing ${attachment.file.name} for review.`,
            attachment_id: uploaded.attachment_id,
          });
        },
      });
      return;
    }

    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "message", body: trimmed }));
      setComposerValue("");
      return;
    }

    createMessage.mutate({ body: trimmed });
  }

  function handleEndConsultation() {
    if (!activeThread || !activeThreadDetails?.can_end_consultation) {
      return;
    }
    const confirmed = window.confirm("End this consultation? Patient and doctor messages will become read-only.");
    if (confirmed) {
      endConsultation.mutate(activeThread);
    }
  }

  function handleDisputeSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeThread || !activeThreadDetails?.can_raise_dispute) {
      return;
    }
    createDispute.mutate({
      reason_category: disputeReason,
      explanation: disputeExplanation.trim(),
    });
  }

  return (
    <Section title={sectionTitle} description={sectionDescription}>
      <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_28px_80px_-48px_rgba(15,23,42,0.32)]">
        <div className="grid min-h-[calc(100vh-15rem)] bg-[#F8FAFC] lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside
            className={cn(
              "border-r border-[#E5E7EB] bg-white",
              isMobileChatOpen ? "hidden lg:block" : "block",
            )}
          >
            <ConsultationListHeader
              search={search}
              onSearchChange={setSearch}
            />

            <div className="h-[calc(100vh-20rem)] min-h-[28rem] overflow-y-auto p-3">
              {threads.isLoading ? (
                <ConversationSkeleton />
              ) : threads.error ? (
                <div className="p-2">
                  <ErrorMessage error={threads.error} context="messages" />
                </div>
              ) : filteredThreads.length ? (
                <div className="space-y-2">
                  {filteredThreads.map((thread) => (
                    <ConsultationListItem
                      key={thread.id}
                      thread={thread}
                      role={currentUser?.role}
                      isActive={activeThread === thread.id}
                      latestMessage={thread.id === activeThread ? orderedMessageItems.at(-1) : undefined}
                      onClick={() => selectThread(thread.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No consultations yet"
                  description="Your consultation will appear here once your care team responds."
                />
              )}
            </div>
          </aside>

          <main
            className={cn(
              "flex min-h-[calc(100vh-15rem)] flex-col bg-[linear-gradient(180deg,#F8FBFF,#F9FAFB)]",
              !isMobileChatOpen && activeThread ? "hidden lg:flex" : "flex",
            )}
          >
            <ConsultationHeader
              role={currentUser?.role}
              thread={activeThreadDetails}
              liveConnected={liveConnected}
              realtimeUnavailable={realtimeUnavailable}
              isEnding={endConsultation.isPending}
              onEndConsultation={handleEndConsultation}
              onBack={() => setIsMobileChatOpen(false)}
            />
            {endConsultation.error ? (
              <div className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 sm:px-6">
                Consultation could not be ended. Please try again.
              </div>
            ) : null}
            {activeThread && realtimeUnavailable ? (
              <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-800 sm:px-6">
                Realtime connection lost. Messages will refresh manually.
              </div>
            ) : null}
            {activeThreadDetails?.triage_summary ? (
              <TriageSummaryPanel thread={activeThreadDetails} role={currentUser?.role} />
            ) : null}
            {activeThreadDetails ? (
              <ConsultationLifecycleBanner
                thread={activeThreadDetails}
                disputeReason={disputeReason}
                disputeExplanation={disputeExplanation}
                isSubmitting={createDispute.isPending}
                disputeError={createDispute.error}
                onReasonChange={setDisputeReason}
                onExplanationChange={setDisputeExplanation}
                onSubmit={handleDisputeSubmit}
              />
            ) : null}

            <div
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_20%_0%,rgba(96,165,250,0.14),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.12),transparent_24%)] px-4 py-5 sm:px-6"
            >
              {!activeThread ? (
                <div className="flex min-h-full items-center justify-center">
                  <EmptyState
                    title="No consultation yet."
                    description=""
                  />
                </div>
              ) : messages.isLoading ? (
                <MessageSkeleton />
              ) : messages.error ? (
                <ErrorMessage error={messages.error} context="messages" />
              ) : orderedMessageItems.length ? (
                <div className="space-y-4">
                  {orderedMessageItems.map((message) => (
                    <ChatMessageBubble
                      key={message.id}
                      message={message}
                      thread={activeThreadDetails}
                      currentUserId={currentUser?.id}
                      currentUserRole={currentUser?.role}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-full items-center justify-center">
                  <EmptyState
                    title="No consultation yet."
                    description=""
                  />
                </div>
              )}
            </div>

            <ChatComposer
              value={composerValue}
              disabled={!activeThread || !canSendInActiveThread}
              disabledReason={
                activeThread && !canSendInActiveThread
                  ? "This consultation is closed. History remains available, but new messages and uploads are disabled."
                  : ""
              }
              isSending={createMessage.isPending || uploadAttachment.isPending}
              attachment={attachment}
              error={uploadAttachment.error || createMessage.error}
              onValueChange={setComposerValue}
              onSubmit={handleSubmit}
              onPickAttachment={() => fileInputRef.current?.click()}
              onClearAttachment={clearAttachment}
            />
            <input
              ref={fileInputRef}
              className="hidden"
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleAttachmentChange}
            />
          </main>
        </div>
      </div>
    </Section>
  );
}

function TriageSummaryPanel({ thread, role }: { thread: Thread; role?: UserRole }) {
  const summary = thread.triage_summary;
  if (!summary) {
    return null;
  }
  const symptoms = summary.symptoms?.filter(Boolean) ?? [];
  const redFlags = summary.red_flags?.filter(Boolean) ?? [];
  const title = role === "doctor" ? "Patient triage summary" : "Your triage summary";

  return (
    <details className="border-b border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 text-sm sm:px-6" open={role === "doctor"}>
      <summary className="cursor-pointer list-none font-bold text-[#1F2937]">
        {title}
        <span className="ml-2 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-[#2563EB]">
          {formatStatus(summary.risk_level || summary.severity) || "Check-in"}
        </span>
      </summary>
      <div className="mt-3 grid gap-3 text-slate-600 sm:grid-cols-2">
        {symptoms.length ? (
          <p>
            <span className="font-semibold text-[#1F2937]">Symptoms:</span> {symptoms.join(", ")}
          </p>
        ) : null}
        {summary.duration ? (
          <p>
            <span className="font-semibold text-[#1F2937]">Duration:</span> {summary.duration}
          </p>
        ) : null}
        {summary.department ? (
          <p>
            <span className="font-semibold text-[#1F2937]">Suggested department:</span> {summary.department}
          </p>
        ) : null}
        {summary.created_at ? (
          <p>
            <span className="font-semibold text-[#1F2937]">Captured:</span> {relativeThreadTime(summary.created_at)}
          </p>
        ) : null}
      </div>
      {summary.recommendation ? (
        <p className="mt-3 leading-6 text-slate-700">{summary.recommendation}</p>
      ) : null}
      {redFlags.length ? (
        <p className="mt-3 rounded-[8px] border border-rose-100 bg-rose-50 px-3 py-2 text-rose-700">
          <span className="font-semibold">Red flags:</span> {redFlags.join(", ")}
        </p>
      ) : null}
      <p className="mt-3 text-xs leading-5 text-slate-500">{summary.disclaimer}</p>
    </details>
  );
}

function ConsultationLifecycleBanner({
  thread,
  disputeReason,
  disputeExplanation,
  isSubmitting,
  disputeError,
  onReasonChange,
  onExplanationChange,
  onSubmit,
}: {
  thread: Thread;
  disputeReason: string;
  disputeExplanation: string;
  isSubmitting: boolean;
  disputeError: unknown;
  onReasonChange: (value: string) => void;
  onExplanationChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  if (thread.consultation_lifecycle_status === "open") {
    return null;
  }

  const statusLabel = formatStatus(thread.consultation_lifecycle_status || thread.consultation_status);

  return (
    <div className="border-b border-[#DDEBFF] bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 rounded-[12px] border border-[#DDEBFF] bg-[#F8FBFF] p-3 text-sm text-slate-700">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
          <div>
            <p className="font-bold text-[#1F2937]">Consultation status: {statusLabel}</p>
            <p className="mt-1 leading-6">
              This conversation is read-only. Patient and doctor messages remain available for history.
            </p>
          </div>
        </div>

        {thread.can_raise_dispute ? (
          <form className="grid gap-3 border-t border-[#DDEBFF] pt-3" onSubmit={onSubmit}>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Dispute reason</label>
              <select
                className="mt-1 min-h-11 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937] outline-none focus:border-[#60A5FA]"
                value={disputeReason}
                onChange={(event) => onReasonChange(event.target.value)}
              >
                <option value="ended_too_early">Consultation ended too early</option>
                <option value="issue_not_addressed">My issue was not addressed</option>
                <option value="need_clarification">I need clarification</option>
                <option value="technical_issue">Technical issue</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Optional explanation</label>
              <textarea
                className="mt-1 min-h-20 w-full rounded-[8px] border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-[#1F2937] outline-none focus:border-[#60A5FA]"
                value={disputeExplanation}
                placeholder="Share what the review team should know."
                onChange={(event) => onExplanationChange(event.target.value)}
              />
            </div>
            {disputeError ? <ErrorMessage error={disputeError} context="messages" /> : null}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting dispute..." : "Raise dispute"}
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}

function ConsultationListHeader({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
      <div className="border-b border-[#E5E7EB] p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <Avatar label="CT" tone="blue" />
        <div>
          <p className="ct-card-title text-[#1F2937]">Consultation</p>
        </div>
      </div>

      <label className="mt-4 flex min-h-11 items-center gap-2 rounded-[16px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-slate-500 focus-within:border-[#60A5FA] focus-within:bg-white">
        <Search className="h-4 w-4" />
        <input
          className="w-full bg-transparent text-[#1F2937] outline-none placeholder:text-slate-400"
          value={search}
          placeholder="Search conversations"
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
    </div>
  );
}

function ConsultationListItem({
  thread,
  role,
  isActive,
  latestMessage,
  onClick,
}: {
  thread: Thread;
  role?: UserRole;
  isActive: boolean;
  latestMessage?: Message;
  onClick: () => void;
}) {
  const displayName = participantName(thread, role);
  const roleLabel = participantRole(thread, role);
  const updatedAt = thread.last_message?.created_at || thread.updated_at || thread.created_at;
  const unreadCount = thread.unread_count ?? 0;
  const status = formatStatus(thread.consultation_status || thread.appointment?.status);

  return (
    <button
      type="button"
      className={cn(
        "group flex w-full gap-3 rounded-[20px] border p-3 text-left transition duration-150",
        isActive
          ? "border-[#BFDBFE] bg-[#EFF6FF] shadow-[0_16px_42px_-34px_rgba(37,99,235,0.28)]"
          : "border-transparent bg-white hover:-translate-y-0.5 hover:border-[#E5E7EB] hover:shadow-[0_16px_42px_-34px_rgba(15,23,42,0.22)]",
      )}
      onClick={onClick}
    >
      <Avatar label={role === "patient" ? "Dr" : "Pt"} tone={isActive ? "blue" : "green"} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-[#1F2937]">{displayName}</span>
          <span className="shrink-0 text-[11px] font-medium text-slate-400">
            {relativeThreadTime(updatedAt)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span>{roleLabel}</span>
          {status ? <span className="rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[#2563EB]">{status}</span> : null}
          {unreadCount > 0 ? <span className="rounded-full bg-[#DBEAFE] px-2 py-0.5 text-[#1D4ED8]">{unreadCount} unread</span> : null}
        </span>
        <span className="mt-1 line-clamp-1 text-sm text-slate-500">
          {threadPreview(thread, role, latestMessage)}
        </span>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold text-[#10B981]">
          <CheckCircle2 className="h-3 w-3" />
          Consultation
        </span>
      </span>
    </button>
  );
}

function ConsultationHeader({
  role,
  thread,
  liveConnected,
  realtimeUnavailable,
  isEnding,
  onEndConsultation,
  onBack,
}: {
  role?: UserRole;
  thread: Thread | null;
  liveConnected: boolean;
  realtimeUnavailable: boolean;
  isEnding: boolean;
  onEndConsultation: () => void;
  onBack: () => void;
}) {
  const title = participantName(thread, role);
  const subtitle = participantRole(thread, role);
  const status = formatStatus(thread?.consultation_status || thread?.appointment?.status);

  return (
    <div className="flex min-h-20 items-center justify-between gap-3 border-b border-[#E5E7EB] bg-white px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-[#EFF6FF] hover:text-[#2563EB] lg:hidden"
          onClick={onBack}
          aria-label="Back to consultations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar label={role === "patient" ? "Dr" : "Pt"} tone="blue" size="lg" />
        <div className="min-w-0">
          <h2 className="truncate font-heading text-lg font-semibold text-[#1F2937]">
            {title}
          </h2>
          <p className="mt-0.5 flex min-w-0 items-center gap-2 text-sm text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            <span className="truncate">{status ? `${subtitle} · ${status}` : subtitle}</span>
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {thread?.can_end_consultation ? (
          <Button type="button" variant="secondary" size="sm" disabled={isEnding} onClick={onEndConsultation}>
            {isEnding ? "Ending..." : "End Consultation"}
          </Button>
        ) : null}
        <div className="hidden items-center gap-2 rounded-full bg-[#ECFDF5] px-3 py-2 text-xs font-semibold text-[#047857] sm:inline-flex">
          <Stethoscope className="h-4 w-4" />
          {liveConnected ? "Live chat" : realtimeUnavailable ? "Manual refresh" : "Secure chat"}
        </div>
      </div>
    </div>
  );
}

function ChatMessageBubble({
  message,
  thread,
  currentUserId,
  currentUserRole,
}: {
  message: Message;
  thread: Thread | null;
  currentUserId?: number | null;
  currentUserRole?: UserRole;
}) {
  const isMine = Boolean(currentUserId && message.sender === currentUserId);
  const senderName = messageSenderName(message, thread, currentUserId, currentUserRole);

  return (
    <article className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
      {!isMine ? <Avatar label={currentUserRole === "doctor" ? "Pt" : "Dr"} tone="green" size="sm" /> : null}
      <div
        className={cn(
          "max-w-[82%] rounded-[22px] px-4 py-3 shadow-[0_12px_34px_-28px_rgba(15,23,42,0.24)] sm:max-w-[68%]",
          isMine
            ? "rounded-br-md bg-[linear-gradient(135deg,#2563EB,#60A5FA)] text-white"
            : "rounded-bl-md border border-white bg-white text-[#1F2937]",
        )}
      >
        <p className="whitespace-pre-line text-sm leading-7">{message.body}</p>
        {message.attachment_url ? (
          <a
            className={cn(
              "mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold",
              isMine ? "bg-white/15 text-white" : "bg-[#EFF6FF] text-[#2563EB]",
            )}
            href={message.attachment_url}
            target="_blank"
            rel="noreferrer"
          >
            <Paperclip className="h-3.5 w-3.5" />
            Open attachment
          </a>
        ) : null}
        <p className={cn("mt-2 text-[11px]", isMine ? "text-white/75" : "text-slate-400")}>
          {senderName} at {messageTime(message.created_at)}
        </p>
      </div>
    </article>
  );
}

function ChatComposer({
  value,
  disabled,
  disabledReason,
  isSending,
  attachment,
  error,
  onValueChange,
  onSubmit,
  onPickAttachment,
  onClearAttachment,
}: {
  value: string;
  disabled: boolean;
  disabledReason: string;
  isSending: boolean;
  attachment: AttachmentPreview | null;
  error: unknown;
  onValueChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPickAttachment: () => void;
  onClearAttachment: () => void;
}) {
  return (
    <form className="border-t border-[#E5E7EB] bg-white p-3 sm:p-4" onSubmit={onSubmit}>
      {error ? <ErrorMessage error={error} context="messageSend" /> : null}
      {disabled && disabledReason ? (
        <p className="mb-3 rounded-[8px] bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
          {disabledReason}
        </p>
      ) : null}

      {attachment ? (
        <div className="mb-3 flex items-center gap-3 rounded-[18px] border border-[#DDEBFF] bg-[#F8FBFF] p-3">
          {attachment.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachment.previewUrl}
              alt=""
              className="h-14 w-14 rounded-[14px] object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-white text-[#2563EB]">
              <Paperclip className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#1F2937]">{attachment.file.name}</p>
            <p className="text-xs text-slate-500">{formatFileSize(attachment.file.size)}</p>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-rose-600"
            onClick={onClearAttachment}
            aria-label="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div className="flex items-end gap-2 rounded-[22px] border border-[#E5E7EB] bg-[#F9FAFB] p-2.5 focus-within:border-[#60A5FA] focus-within:bg-white">
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#EFF6FF]"
          disabled={disabled || isSending}
          onClick={onPickAttachment}
          aria-label="Add attachment"
        >
          <Plus className="h-5 w-5" />
        </button>
        <textarea
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-1 py-3 text-sm leading-6 text-[#1F2937] outline-none placeholder:text-slate-400"
          value={value}
          rows={1}
          placeholder={disabled ? "Choose a consultation first" : "Type a message"}
          disabled={disabled || isSending}
          onChange={(event) => onValueChange(event.target.value)}
        />
        <Button
          type="submit"
          className="h-11 min-h-11 w-11 shrink-0 rounded-full px-0"
          disabled={disabled || isSending || (!value.trim() && !attachment)}
          aria-label="Send message"
        >
          {isSending ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="mt-2 flex items-center gap-2 px-2 text-xs text-slate-500">
        <ImageIcon className="h-3.5 w-3.5" />
        Add file from device.
      </p>
    </form>
  );
}

function Avatar({
  label,
  tone,
  size = "md",
}: {
  label: string;
  tone: "blue" | "green";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-heading font-extrabold",
        size === "sm" && "h-8 w-8 text-xs",
        size === "md" && "h-12 w-12 text-sm",
        size === "lg" && "h-14 w-14 text-base",
        tone === "blue" && "bg-[#DBEAFE] text-[#2563EB]",
        tone === "green" && "bg-[#D1FAE5] text-[#047857]",
      )}
    >
      {label}
    </span>
  );
}

function ConversationSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((item) => (
        <div key={item} className="h-24 animate-pulse rounded-[20px] bg-slate-100" />
      ))}
    </div>
  );
}

function MessageSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          className={cn(
            "h-20 max-w-[70%] animate-pulse rounded-[22px] bg-white/80",
            item % 2 ? "ml-auto" : "mr-auto",
          )}
        />
      ))}
    </div>
  );
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}


