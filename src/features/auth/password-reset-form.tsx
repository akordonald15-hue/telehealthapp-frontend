"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { authApi } from "@/lib/api/endpoints";
import {
  emailSchema,
  passwordResetConfirmSchema,
  type EmailInput,
  type PasswordResetConfirmInput,
} from "@/lib/validation/auth";

export function PasswordResetForm() {
  const requestReset = useMutation({ mutationFn: authApi.passwordResetRequest });
  const confirmReset = useMutation({ mutationFn: authApi.passwordResetConfirm });
  const requestForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });
  const confirmForm = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { token: "", new_password: "" },
  });

  return (
    <div className="grid gap-6">
      <form className="grid gap-4" onSubmit={requestForm.handleSubmit((values) => requestReset.mutate(values))}>
        {requestReset.isSuccess ? <Notice title={requestReset.data.detail} tone="success" /> : null}
        {requestReset.error ? <Notice title="Request failed">{requestReset.error.message}</Notice> : null}
        <Field label="Email" error={requestForm.formState.errors.email?.message}>
          <Input type="email" autoComplete="email" {...requestForm.register("email")} />
        </Field>
        <Button type="submit" disabled={requestReset.isPending}>
          {requestReset.isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>
      <div className="h-px bg-zinc-200" />
      <form className="grid gap-4" onSubmit={confirmForm.handleSubmit((values) => confirmReset.mutate(values))}>
        {confirmReset.isSuccess ? <Notice title={confirmReset.data.detail} tone="success" /> : null}
        {confirmReset.error ? <Notice title="Password reset failed">{confirmReset.error.message}</Notice> : null}
        <Field label="Reset token" error={confirmForm.formState.errors.token?.message}>
          <Input {...confirmForm.register("token")} />
        </Field>
        <Field label="New password" error={confirmForm.formState.errors.new_password?.message}>
          <Input type="password" autoComplete="new-password" {...confirmForm.register("new_password")} />
        </Field>
        <Button type="submit" variant="secondary" disabled={confirmReset.isPending}>
          {confirmReset.isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
