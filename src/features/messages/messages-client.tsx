"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertTriangle,
  Image as ImageIcon,
  Mic,
  Paperclip,
  Plus,
  Search,
  Send,
  Square,
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
import { cn } from "@/lib/utils";

type AttachmentPreview = {
  file: File;
  previewUrl: string | null;
  kind: "file" | "image" | "voice";
  durationSeconds?: number;
};

const VOICE_NOTE_MAX_SECONDS = 60;
const VOICE_MIME_CANDIDATES = ["audio/webm", "audio/mp4", "audio/ogg"];

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
  const symptoms = safeTextList(thread.triage_summary?.symptoms);
  if (symptoms.length) {
    return `Triage: ${symptoms.join(", ")}`;
  }
  return role === "patient" ? "Your consultation thread is ready." : "Consultation thread is ready.";
}

function safeTextList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean).slice(0, 8);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 8);
  }
  return [];
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

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds < 1) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

function formatStatus(value?: string | null) {
  if (!value) {
    return "";
  }
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function consultationWindowLabel(thread: Thread | null, nowMs = Date.now()) {
  if (!thread?.consultation_expires_at) {
    return "Timer starts when doctor replies";
  }
  const expiresAt = new Date(thread.consultation_expires_at).getTime();
  if (Number.isNaN(expiresAt)) {
    return "20-minute consultation";
  }
  const remainingMs = expiresAt - nowMs;
  if (remainingMs <= 0 || thread.can_send_messages === false) {
    return "Consultation ended";
  }
  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
  return `${minutes} min left`;
}

function threadExpiredByClock(thread: Thread | null, nowMs = Date.now()) {
  if (!thread?.consultation_expires_at) {
    return false;
  }
  const expiresAt = new Date(thread.consultation_expires_at).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= nowMs;
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

function messageAttachmentId(message: Message) {
  const attachmentUrl = typeof message.attachment_url === "string" ? message.attachment_url : "";
  const match = attachmentUrl.match(/\/attachments\/(\d+)\/(?:download|file)\//);
  return match?.[1] ?? null;
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
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordingError, setRecordingError] = useState<Error | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<BlobPart[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const recordingElapsedSecondsRef = useRef(0);

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
    mutationFn: async (preview: AttachmentPreview) => {
      if (!activeThread) {
        throw new Error("Choose a consultation first.");
      }

      const file = preview.file;
      const uploadInit = await messagingApi.initAttachmentUpload(activeThread, {
        filename: file.name,
        content_type: file.type || "application/octet-stream",
        size_bytes: file.size,
        duration_seconds: preview.kind === "voice" ? preview.durationSeconds : undefined,
      });
      await messagingApi.uploadAttachmentFile(uploadInit.attachment_id, file);
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
  const activeThreadExpired = threadExpiredByClock(activeThreadDetails, clockNow);
  const canSendInActiveThread = Boolean(activeThread && activeThreadDetails?.can_send_messages !== false && !activeThreadExpired);
  const canRecordVoice = Boolean(currentUser?.role === "patient" && canSendInActiveThread);

  useEffect(() => {
    if (!activeThreadDetails?.consultation_expires_at || activeThreadDetails.can_send_messages === false) {
      return;
    }
    const interval = window.setInterval(() => setClockNow(Date.now()), 15_000);
    return () => window.clearInterval(interval);
  }, [activeThreadDetails?.consultation_expires_at, activeThreadDetails?.can_send_messages]);

  useEffect(() => {
    if (!activeThreadDetails?.consultation_expires_at || activeThreadDetails.can_send_messages === false) {
      return;
    }
    const expiresAt = new Date(activeThreadDetails.consultation_expires_at).getTime();
    if (!Number.isFinite(expiresAt)) {
      return;
    }
    const delay = Math.max(0, expiresAt - Date.now() + 500);
    const timeout = window.setTimeout(async () => {
      setClockNow(Date.now());
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
      await queryClient.invalidateQueries({ queryKey: ["messages", activeThread] });
    }, delay);
    return () => window.clearTimeout(timeout);
  }, [activeThread, activeThreadDetails?.consultation_expires_at, activeThreadDetails?.can_send_messages, queryClient]);

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
    return () => {
      if (recordingTimerRef.current) {
        window.clearInterval(recordingTimerRef.current);
      }
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

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

  function stopVoiceRecording() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
    }
  }

  async function startVoiceRecording() {
    if (!canRecordVoice || isRecordingVoice) {
      return;
    }
    setRecordingError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setRecordingError(new Error("Voice recording is not available on this browser."));
      return;
    }

    try {
      clearAttachment();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = VOICE_MIME_CANDIDATES.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recordingChunksRef.current = [];
      recordingStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      recordingElapsedSecondsRef.current = 0;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        if (recordingTimerRef.current) {
          window.clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        stream.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
        mediaRecorderRef.current = null;
        setIsRecordingVoice(false);

        const durationSeconds = Math.max(1, Math.min(VOICE_NOTE_MAX_SECONDS, recordingElapsedSecondsRef.current));
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        recordingChunksRef.current = [];
        if (!blob.size) {
          setRecordingError(new Error("We could not capture audio. Please try again."));
          return;
        }
        const extension = (recorder.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], `caretekk-voice-note.${extension}`, {
          type: recorder.mimeType || "audio/webm",
        });
        setAttachment({
          file,
          previewUrl: URL.createObjectURL(blob),
          kind: "voice",
          durationSeconds,
        });
        setRecordingSeconds(0);
      };

      recorder.start();
      setIsRecordingVoice(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = window.setInterval(() => {
        recordingElapsedSecondsRef.current += 1;
        setRecordingSeconds(Math.min(recordingElapsedSecondsRef.current, VOICE_NOTE_MAX_SECONDS));
        if (recordingElapsedSecondsRef.current >= VOICE_NOTE_MAX_SECONDS) {
          stopVoiceRecording();
        }
      }, 1000);
    } catch (error) {
      console.warn("Voice recording could not be started.", error);
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current = null;
      setIsRecordingVoice(false);
      setRecordingError(new Error("Microphone access was not available."));
    }
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
      kind: file.type.startsWith("image/") ? "image" : "file",
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
      uploadAttachment.mutate(attachment, {
        onSuccess: (uploaded) => {
          createMessage.mutate({
            body:
              trimmed ||
              (attachment.kind === "voice"
                ? `Voice note (${formatDuration(attachment.durationSeconds)})`
                : `Sharing ${attachment.file.name} for review.`),
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
      <div className="overflow-hidden rounded-[8px] border border-white/80 bg-white shadow-[0_24px_64px_-48px_rgba(15,23,42,0.28)]">
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
                <EmptyState title="No consultations yet" description="Your consultations will appear here." />
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
              nowMs={clockNow}
              liveConnected={liveConnected}
              realtimeUnavailable={realtimeUnavailable}
              isEnding={endConsultation.isPending}
              canEndConsultation={Boolean(activeThreadDetails?.can_end_consultation && !activeThreadExpired)}
              onEndConsultation={handleEndConsultation}
              onBack={() => setIsMobileChatOpen(false)}
            />
            {endConsultation.error ? (
              <div className="border-b border-rose-100 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 sm:px-6">
                Consultation could not be ended. Please try again.
              </div>
            ) : null}
            {activeThread && realtimeUnavailable ? (
              <div className="border-b border-amber-100 bg-amber-50/70 px-4 py-2 text-xs font-medium text-amber-800 sm:px-6">
                Realtime paused. Messages will refresh manually.
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
                  ? activeThreadExpired
                    ? "This consultation has ended. History remains available."
                    : "This consultation is closed. History remains available, but new messages and uploads are disabled."
                  : ""
              }
              isSending={createMessage.isPending || uploadAttachment.isPending}
              attachment={attachment}
              error={recordingError || uploadAttachment.error || createMessage.error}
              canRecordVoice={canRecordVoice}
              isRecordingVoice={isRecordingVoice}
              recordingSeconds={recordingSeconds}
              onValueChange={setComposerValue}
              onSubmit={handleSubmit}
              onPickAttachment={() => fileInputRef.current?.click()}
              onStartVoiceRecording={startVoiceRecording}
              onStopVoiceRecording={stopVoiceRecording}
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
  const symptoms = safeTextList(summary.symptoms);
  const redFlags = safeTextList(summary.red_flags);
  const possibleCauses = safeTextList(summary.possible_causes);
  const urgencyGuidance = safeTextList(summary.urgency_guidance);
  const selfCareGuidance = safeTextList(summary.self_care_guidance);
  const title = role === "doctor" ? "Patient triage summary" : "Your triage summary";

  return (
    <details className="border-b border-[#DDEBFF] bg-[#F8FBFF] px-4 py-3 text-sm sm:px-6" open={role === "doctor"}>
      <summary className="cursor-pointer list-none font-semibold text-[#1F2937]">
        {title}
        <span className="ml-2 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-[#2563EB]">
          {formatStatus(summary.risk_level || summary.severity) || "Check-in"}
        </span>
      </summary>
      <div className="mt-3 grid gap-2 text-slate-600 sm:grid-cols-2">
        {symptoms.length ? (
          <p className="rounded-[8px] bg-white px-3 py-2">
            <span className="font-semibold text-[#1F2937]">Symptoms:</span> {symptoms.join(", ")}
          </p>
        ) : null}
        {summary.duration ? (
          <p className="rounded-[8px] bg-white px-3 py-2">
            <span className="font-semibold text-[#1F2937]">Duration:</span> {summary.duration}
          </p>
        ) : null}
        {summary.department ? (
          <p className="rounded-[8px] bg-white px-3 py-2">
            <span className="font-semibold text-[#1F2937]">Specialty:</span> {summary.department}
          </p>
        ) : null}
        {summary.severity ? (
          <p className="rounded-[8px] bg-white px-3 py-2">
            <span className="font-semibold text-[#1F2937]">Severity:</span> {formatStatus(summary.severity)}
          </p>
        ) : null}
        {summary.created_at ? (
          <p className="rounded-[8px] bg-white px-3 py-2">
            <span className="font-semibold text-[#1F2937]">Captured:</span> {relativeThreadTime(summary.created_at)}
          </p>
        ) : null}
      </div>
      {summary.recommendation ? (
        <p className="mt-3 rounded-[8px] border border-[#DDEBFF] bg-white px-3 py-2 leading-6 text-slate-700">{summary.recommendation}</p>
      ) : null}
      {redFlags.length ? (
        <p className="mt-2 rounded-[8px] border border-rose-100 bg-rose-50 px-3 py-2 text-rose-700">
          <span className="font-semibold">Red flags:</span> {redFlags.join(", ")}
        </p>
      ) : null}
      {urgencyGuidance.length ? (
        <p className="mt-2 rounded-[8px] border border-amber-100 bg-amber-50 px-3 py-2 text-amber-800">
          <span className="font-semibold">Urgency guidance:</span> {urgencyGuidance.join(" ")}
        </p>
      ) : null}
      {possibleCauses.length ? (
        <p className="mt-2 rounded-[8px] border border-[#DDEBFF] bg-white px-3 py-2 text-slate-700">
          <span className="font-semibold text-[#1F2937]">Possible causes:</span> {possibleCauses.join(", ")}
        </p>
      ) : null}
      {selfCareGuidance.length ? (
        <details className="mt-2 rounded-[8px] border border-[#DDEBFF] bg-white px-3 py-2 text-slate-700">
          <summary className="cursor-pointer list-none text-sm font-semibold text-[#1F2937]">Self-care guidance</summary>
          <p className="mt-2 leading-6">{selfCareGuidance.join(", ")}</p>
        </details>
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
  if (thread.consultation_lifecycle_status === "open" && thread.can_send_messages !== false) {
    return null;
  }

  const statusLabel = thread.can_send_messages === false
    ? "Consultation ended"
    : formatStatus(thread.consultation_lifecycle_status || thread.consultation_status);

  return (
    <div className="border-b border-[#DDEBFF] bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-col gap-3 rounded-[8px] border border-[#DDEBFF] bg-[#F8FBFF] p-3 text-sm text-slate-700">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
          <div>
            <p className="font-bold text-[#1F2937]">Consultation status: {statusLabel}</p>
            <p className="mt-1 leading-6">
              You can view the conversation history.
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

      <label className="mt-4 flex min-h-11 items-center gap-2 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] px-3 text-sm text-slate-500 focus-within:border-[#60A5FA] focus-within:bg-white">
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
        "group flex w-full gap-3 rounded-[8px] border p-3 text-left transition duration-150",
        isActive
          ? "border-[#BFDBFE] bg-[#EFF6FF] shadow-[0_16px_42px_-34px_rgba(37,99,235,0.28)]"
          : "border-transparent bg-white hover:-translate-y-0.5 hover:border-[#E5E7EB] hover:shadow-[0_16px_42px_-34px_rgba(15,23,42,0.18)]",
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
        {thread.can_send_messages === false ? (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold text-slate-500">
            Closed
          </span>
        ) : null}
      </span>
    </button>
  );
}

function ConsultationHeader({
  role,
  thread,
  nowMs,
  liveConnected,
  realtimeUnavailable,
  isEnding,
  canEndConsultation,
  onEndConsultation,
  onBack,
}: {
  role?: UserRole;
  thread: Thread | null;
  nowMs: number;
  liveConnected: boolean;
  realtimeUnavailable: boolean;
  isEnding: boolean;
  canEndConsultation: boolean;
  onEndConsultation: () => void;
  onBack: () => void;
}) {
  const title = participantName(thread, role);
  const subtitle = participantRole(thread, role);
  const status = formatStatus(thread?.consultation_status || thread?.appointment?.status);
  const windowLabel = consultationWindowLabel(thread, nowMs);

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
          <p className="mt-0.5 text-xs font-semibold text-[#2563EB]">{windowLabel}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canEndConsultation ? (
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
  const isVoiceAttachment =
    message.attachment_kind === "voice" || Boolean(message.attachment_content_type?.startsWith("audio/"));
  const shouldHideGeneratedVoiceLabel = isVoiceAttachment && /^voice note(?:\s*\([^)]+\))?$/i.test(message.body.trim());

  return (
    <article className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
      {!isMine ? <Avatar label={currentUserRole === "doctor" ? "Pt" : "Dr"} tone="green" size="sm" /> : null}
      <div
        className={cn(
          "max-w-[86%] rounded-[8px] px-3.5 py-2.5 shadow-[0_12px_34px_-30px_rgba(15,23,42,0.24)] sm:max-w-[68%]",
          isMine
            ? "bg-[linear-gradient(135deg,#2563EB,#60A5FA)] text-white"
            : "border border-white bg-white text-[#1F2937]",
        )}
      >
        {message.body && !shouldHideGeneratedVoiceLabel ? <p className="whitespace-pre-line text-sm leading-6">{message.body}</p> : null}
        {message.attachment_url && isVoiceAttachment ? (
          <VoiceNotePlayer message={message} isMine={isMine} />
        ) : message.attachment_url ? (
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
        <p className={cn("mt-2 text-[11px]", isMine ? "text-right text-white/75" : "text-slate-400")}>
          {isMine ? messageTime(message.created_at) : `${senderName} · ${messageTime(message.created_at)}`}
        </p>
      </div>
    </article>
  );
}

function VoiceNotePlayer({ message, isMine }: { message: Message; isMine: boolean }) {
  const attachmentId = messageAttachmentId(message);
  const audioUrl = attachmentId ? `/api/messages/attachments/${attachmentId}/file/` : null;

  return (
    <div
      className={cn(
        "mt-2 flex min-w-[13rem] max-w-full items-center gap-2 rounded-[8px] px-2.5 py-2",
        isMine ? "bg-white/15 text-white" : "border border-[#DDEBFF] bg-[#F8FBFF] text-[#1F2937]",
      )}
    >
      {audioUrl ? (
        <audio className="h-8 min-w-0 flex-1" controls preload="metadata" src={audioUrl}>
          Voice note playback is not available in this browser.
        </audio>
      ) : (
        <p className={cn("min-w-0 flex-1 text-xs", isMine ? "text-white/75" : "text-slate-500")}>Audio unavailable</p>
      )}
      <span className={cn("shrink-0 text-[11px] font-medium", isMine ? "text-white/80" : "text-slate-500")}>
        {formatDuration(message.attachment_duration_seconds)}
      </span>
    </div>
  );
}

function ChatComposer({
  value,
  disabled,
  disabledReason,
  isSending,
  attachment,
  error,
  canRecordVoice,
  isRecordingVoice,
  recordingSeconds,
  onValueChange,
  onSubmit,
  onPickAttachment,
  onStartVoiceRecording,
  onStopVoiceRecording,
  onClearAttachment,
}: {
  value: string;
  disabled: boolean;
  disabledReason: string;
  isSending: boolean;
  attachment: AttachmentPreview | null;
  error: unknown;
  canRecordVoice: boolean;
  isRecordingVoice: boolean;
  recordingSeconds: number;
  onValueChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPickAttachment: () => void;
  onStartVoiceRecording: () => void;
  onStopVoiceRecording: () => void;
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
        <div className="mb-3 flex items-center gap-3 rounded-[8px] border border-[#DDEBFF] bg-[#F8FBFF] p-3">
          {attachment.kind === "voice" && attachment.previewUrl ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-white text-[#2563EB]">
              <Mic className="h-5 w-5" />
            </span>
          ) : attachment.previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={attachment.previewUrl}
              alt=""
              className="h-14 w-14 rounded-[8px] object-cover"
            />
          ) : (
            <span className="flex h-14 w-14 items-center justify-center rounded-[8px] bg-white text-[#2563EB]">
              <Paperclip className="h-5 w-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            {attachment.kind === "voice" && attachment.previewUrl ? (
              <div className="flex items-center gap-2">
                <audio className="h-8 min-w-0 flex-1" controls preload="metadata" src={attachment.previewUrl}>
                  Voice note playback is not available in this browser.
                </audio>
                <span className="shrink-0 text-[11px] font-medium text-slate-500">
                  {formatDuration(attachment.durationSeconds)}
                </span>
              </div>
            ) : (
              <>
                <p className="truncate text-sm font-semibold text-[#1F2937]">{attachment.file.name}</p>
                <p className="text-xs text-slate-500">{formatFileSize(attachment.file.size)}</p>
              </>
            )}
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

      <div className="flex items-end gap-2 rounded-[8px] border border-[#E5E7EB] bg-[#F9FAFB] p-2.5 focus-within:border-[#60A5FA] focus-within:bg-white">
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#2563EB] shadow-sm transition hover:-translate-y-0.5 hover:bg-[#EFF6FF]"
          disabled={disabled || isSending}
          onClick={(event) => {
            event.preventDefault();
            onPickAttachment();
          }}
          aria-label="Add attachment"
        >
          <Plus className="h-5 w-5" />
        </button>
        {canRecordVoice ? (
          <button
            type="button"
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-sm transition hover:-translate-y-0.5",
              isRecordingVoice ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-white text-[#2563EB] hover:bg-[#EFF6FF]",
            )}
            disabled={disabled || isSending}
            onClick={isRecordingVoice ? onStopVoiceRecording : onStartVoiceRecording}
            aria-label={isRecordingVoice ? "Stop voice note" : "Record voice note"}
          >
            {isRecordingVoice ? <Square className="h-4 w-4 fill-current" /> : <Mic className="h-5 w-5" />}
          </button>
        ) : null}
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
        {isRecordingVoice ? (
          <>
            <Mic className="h-3.5 w-3.5 text-rose-600" />
            Recording {formatDuration(recordingSeconds)} / {formatDuration(VOICE_NOTE_MAX_SECONDS)}
          </>
        ) : (
          <>
            <ImageIcon className="h-3.5 w-3.5" />
            {canRecordVoice ? "Attach file or record audio." : "Attach file."}
          </>
        )}
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
        <div key={item} className="h-24 animate-pulse rounded-[8px] bg-slate-100" />
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
            "h-20 max-w-[70%] animate-pulse rounded-[8px] bg-white/80",
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


