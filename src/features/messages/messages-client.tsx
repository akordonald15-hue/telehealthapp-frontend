"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
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
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { messagingApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { buildWebSocketUrl } from "@/lib/realtime";
import { conversationSummary, conversationTitle, messageSenderLabel } from "@/lib/ui/humanize";
import type { Message, Thread, UserRole } from "@/lib/types/backend";
import { uploadToPresignedUrl } from "@/lib/api/client";
import { cn, formatDateTime } from "@/lib/utils";

type AttachmentPreview = {
  file: File;
  previewUrl: string | null;
};

export function MessagesClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const currentUser = userQuery.data;
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [composerValue, setComposerValue] = useState("");
  const [attachment, setAttachment] = useState<AttachmentPreview | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [liveConnected, setLiveConnected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

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
    mutationFn: (body: { body: string; attachment_url?: string }) =>
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

  const threadItems = useMemo(() => threads.data?.results ?? [], [threads.data?.results]);
  const filteredThreads = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return threadItems;
    }
    return threadItems.filter((thread) => {
      const haystack = [
        conversationTitle(currentUser?.role),
        conversationSummary(currentUser?.role),
        formatDateTime(thread.created_at),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [currentUser?.role, search, threadItems]);

  const activeThreadDetails = threadItems.find((thread) => thread.id === activeThread) ?? null;
  const sectionTitle = currentUser?.role === "patient" ? "Consultation" : "Messages";
  const sectionDescription =
    currentUser?.role === "patient"
      ? "Chat with your doctor and care team in one calm, secure place."
      : "Keep patient conversations clear, timely, and easy to follow.";

  useEffect(() => {
    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.data?.results.length, activeThread]);

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
      return;
    }

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => setLiveConnected(true);
    socket.onerror = () => setLiveConnected(false);
    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      setLiveConnected(false);
    };
    socket.onmessage = async () => {
      await queryClient.invalidateQueries({ queryKey: ["messages", activeThread] });
      await queryClient.invalidateQueries({ queryKey: ["threads"] });
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [activeThread, currentUser, queryClient]);

  function selectThread(threadId: number) {
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
    if (!activeThread || createMessage.isPending) {
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
            attachment_url: uploaded.attachment_url,
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

  return (
    <Section title={sectionTitle} description={sectionDescription}>
      {currentUser?.role === "patient" ? (
        <Notice title="Your care conversation" tone="neutral">
          Your consultation will appear here once your doctor or care team is ready to respond.
        </Notice>
      ) : null}

      <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_28px_80px_-48px_rgba(15,23,42,0.55)]">
        <div className="grid min-h-[calc(100vh-15rem)] bg-[#F8FAFC] lg:grid-cols-[22rem_minmax(0,1fr)]">
          <aside
            className={cn(
              "border-r border-[#E5E7EB] bg-white",
              isMobileChatOpen ? "hidden lg:block" : "block",
            )}
          >
            <ConsultationListHeader
              role={currentUser?.role}
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
                      latestMessage={thread.id === activeThread ? messages.data?.results.at(-1) : undefined}
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
              onBack={() => setIsMobileChatOpen(false)}
            />

            <div
              ref={scrollAreaRef}
              className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_20%_0%,rgba(96,165,250,0.14),transparent_28%),radial-gradient(circle_at_90%_10%,rgba(16,185,129,0.12),transparent_24%)] px-4 py-5 sm:px-6"
            >
              {!activeThread ? (
                <div className="flex min-h-full items-center justify-center">
                  <EmptyState
                    title="Choose a consultation"
                    description="Select a consultation to continue the conversation with your care team."
                  />
                </div>
              ) : messages.isLoading ? (
                <MessageSkeleton />
              ) : messages.error ? (
                <ErrorMessage error={messages.error} context="messages" />
              ) : messages.data?.results.length ? (
                <div className="space-y-4">
                  {messages.data.results.map((message) => (
                    <ChatMessageBubble
                      key={message.id}
                      message={message}
                      currentUserId={currentUser?.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-full items-center justify-center">
                  <EmptyState
                    title="This consultation is ready"
                    description="Send a message when you want to share an update or ask your care team a question."
                  />
                </div>
              )}
            </div>

            <ChatComposer
              value={composerValue}
              disabled={!activeThread}
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

function ConsultationListHeader({
  role,
  search,
  onSearchChange,
}: {
  role?: string;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="border-b border-[#E5E7EB] p-4">
      <div className="flex items-center gap-3">
        <Avatar label="CT" tone="blue" />
        <div>
          <p className="font-heading text-lg font-bold text-[#1F2937]">
            {role === "patient" ? "Consultations" : "Conversations"}
          </p>
          <p className="text-sm text-slate-500">Secure care conversations</p>
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
  return (
    <button
      type="button"
      className={cn(
        "group flex w-full gap-3 rounded-[20px] border p-3 text-left transition duration-200",
        isActive
          ? "border-[#BFDBFE] bg-[#EFF6FF] shadow-[0_16px_42px_-34px_rgba(37,99,235,0.65)]"
          : "border-transparent bg-white hover:-translate-y-0.5 hover:border-[#E5E7EB] hover:shadow-[0_16px_42px_-34px_rgba(15,23,42,0.4)]",
      )}
      onClick={onClick}
    >
      <Avatar label={role === "patient" ? "Dr" : "Pt"} tone={isActive ? "blue" : "green"} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-[#1F2937]">{conversationTitle(role)}</span>
          <span className="shrink-0 text-[11px] font-medium text-slate-400">
            {new Date(thread.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        </span>
        <span className="mt-1 line-clamp-1 text-sm text-slate-500">
          {latestMessage?.body || conversationSummary(role)}
        </span>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/80 px-2 py-1 text-[11px] font-bold text-[#10B981]">
          <CheckCircle2 className="h-3 w-3" />
          Care team
        </span>
      </span>
    </button>
  );
}

function ConsultationHeader({
  role,
  thread,
  liveConnected,
  onBack,
}: {
  role?: UserRole;
  thread: Thread | null;
  liveConnected: boolean;
  onBack: () => void;
}) {
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
          <h2 className="truncate font-heading text-lg font-bold text-[#1F2937]">
            {thread ? conversationTitle(role) : "Choose a consultation"}
          </h2>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-slate-500">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            {thread ? (role === "patient" ? "Doctor consultation" : "Care conversation") : "Ready when you are"}
          </p>
        </div>
      </div>
      <div className="hidden items-center gap-2 rounded-full bg-[#ECFDF5] px-3 py-2 text-xs font-bold text-[#047857] sm:inline-flex">
        <Stethoscope className="h-4 w-4" />
        {liveConnected ? "Live chat" : "Secure chat"}
      </div>
    </div>
  );
}

function ChatMessageBubble({
  message,
  currentUserId,
}: {
  message: Message;
  currentUserId?: number | null;
}) {
  const isMine = Boolean(currentUserId && message.sender === currentUserId);

  return (
    <article className={cn("flex gap-2", isMine ? "justify-end" : "justify-start")}>
      {!isMine ? <Avatar label="Dr" tone="green" size="sm" /> : null}
      <div
        className={cn(
          "max-w-[82%] rounded-[22px] px-4 py-3 shadow-[0_12px_34px_-28px_rgba(15,23,42,0.5)] sm:max-w-[68%]",
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
          {messageSenderLabel(message, currentUserId)} {"·"} {formatDateTime(message.created_at)}
        </p>
      </div>
    </article>
  );
}

function ChatComposer({
  value,
  disabled,
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

      <div className="flex items-end gap-2 rounded-[22px] border border-[#E5E7EB] bg-[#F9FAFB] p-2 focus-within:border-[#60A5FA] focus-within:bg-white">
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
        Add photos or documents from your device.
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


