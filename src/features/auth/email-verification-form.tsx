"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { authApi } from "@/lib/api/endpoints";
import { emailSchema, emailVerifySchema, type EmailInput, type EmailVerifyInput } from "@/lib/validation/auth";

export function EmailVerificationForm() {
  const requestVerification = useMutation({ mutationFn: authApi.emailVerificationRequest });
  const confirmVerification = useMutation({ mutationFn: authApi.emailVerificationConfirm });
  const requestForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const confirmForm = useForm<EmailVerifyInput>({
    resolver: zodResolver(emailVerifySchema),
    defaultValues: { token: "" },
  });

  return (
    <div className="grid gap-6">
      <form
        className="grid gap-4"
        onSubmit={requestForm.handleSubmit((values) => requestVerification.mutate(values))}
      >
        {requestVerification.isSuccess ? <Notice title={requestVerification.data.detail} tone="success" /> : null}
        {requestVerification.error ? (
          <Notice title="Verification request failed">{requestVerification.error.message}</Notice>
        ) : null}
        <Field label="Email" error={requestForm.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...requestForm.register("email")} />
        </Field>
        <Button type="submit" disabled={requestVerification.isPending}>
          {requestVerification.isPending ? "Sending..." : "Send verification"}
        </Button>
      </form>
      <div className="h-px bg-zinc-200" />
      <form
        className="grid gap-4"
        onSubmit={confirmForm.handleSubmit((values) => confirmVerification.mutate(values))}
      >
        {confirmVerification.isSuccess ? <Notice title={confirmVerification.data.detail} tone="success" /> : null}
        {confirmVerification.error ? <Notice title="Verification failed">{confirmVerification.error.message}</Notice> : null}
        <Field label="Verification token" error={confirmForm.formState.errors.token?.message}>
          <Input {...confirmForm.register("token")} />
        </Field>
        <Button type="submit" variant="secondary" disabled={confirmVerification.isPending}>
          {confirmVerification.isPending ? "Verifying..." : "Verify email"}
        </Button>
      </form>
    </div>
  );
}
