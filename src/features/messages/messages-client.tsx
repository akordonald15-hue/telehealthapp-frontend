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
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { messagingApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import type { Message, Thread } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";
import { messageSchema } from "@/lib/validation/features";

type MessageInput = z.infer<typeof messageSchema>;

export function MessagesClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [activeThread, setActiveThread] = useState<number | null>(null);
  const threads = useQuery({ queryKey: ["threads"], queryFn: () => messagingApi.threads() });
  const messages = useQuery({
    queryKey: ["messages", activeThread],
    queryFn: () => messagingApi.messages(activeThread as number),
    enabled: Boolean(activeThread),
  });
  const createMessage = useMutation({
    mutationFn: (body: MessageInput) =>
      messagingApi.createMessage(activeThread as number, {
        body: body.body,
        attachment_url: body.attachment_url || undefined,
      }),
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["messages", activeThread] });
    },
  });
  const form = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: { body: "", attachment_url: "" },
  });

  return (
    <Section
      title="Messages"
      description="Threads and messages are filtered by backend participant rules. WebSocket support is available at `ws/threads/{thread_id}/?token=...`."
    >
      {userQuery.data?.role === "patient" ? (
        <Notice title="Thread creation gap">
          The backend thread serializer marks both `patient` and `doctor` read-only. Doctor-created threads can pass
          `patient` through request data, but patient-created threads do not have a matching doctor input path in the
          current view.
        </Notice>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <DataList<Thread>
          data={threads.data}
          isLoading={threads.isLoading}
          empty="No message threads returned."
          renderItem={(thread) => (
            <button
              key={thread.id}
              className="rounded-md border border-zinc-200 bg-white p-4 text-left transition hover:border-emerald-300"
              onClick={() => setActiveThread(thread.id)}
            >
              <p className="font-semibold text-zinc-950">Thread #{thread.id}</p>
              <p className="mt-1 text-sm text-zinc-600">
                Patient #{thread.patient} · Doctor #{thread.doctor}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{formatDateTime(thread.created_at)}</p>
            </button>
          )}
        />

        <div className="grid gap-4">
          <div className="rounded-md border border-zinc-200 bg-white p-4">
            <h2 className="font-semibold text-zinc-950">
              {activeThread ? `Thread #${activeThread}` : "Choose a thread"}
            </h2>
            <div className="mt-4 grid max-h-[32rem] gap-3 overflow-y-auto">
              {messages.data?.results.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              {activeThread && !messages.data?.results.length ? (
                <p className="text-sm text-zinc-600">No messages returned.</p>
              ) : null}
            </div>
          </div>
          <form
            className="grid gap-3 rounded-md border border-zinc-200 bg-white p-4"
            onSubmit={form.handleSubmit((values) => createMessage.mutate(values))}
          >
            <ErrorMessage error={createMessage.error} />
            <Field label="Message" error={form.formState.errors.body?.message}>
              <Textarea {...form.register("body")} disabled={!activeThread} />
            </Field>
            <Field label="Attachment URL" error={form.formState.errors.attachment_url?.message}>
              <Input {...form.register("attachment_url")} disabled={!activeThread} />
            </Field>
            <Button className="w-fit" type="submit" disabled={!activeThread || createMessage.isPending}>
              Send message
            </Button>
          </form>
        </div>
      </div>
    </Section>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <article className="rounded-md bg-stone-50 p-3">
      <p className="text-sm text-zinc-950">{message.body}</p>
      <p className="mt-2 text-xs text-zinc-500">
        Sender #{message.sender} · {formatDateTime(message.created_at)}
      </p>
      {message.attachment_url ? (
        <a className="mt-2 inline-block text-sm font-semibold text-emerald-800" href={message.attachment_url}>
          Open attachment
        </a>
      ) : null}
    </article>
  );
}
