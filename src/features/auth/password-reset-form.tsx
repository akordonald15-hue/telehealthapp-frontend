"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, PasswordInput } from "@/components/ui/input";
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

  const resetCodeRequested = requestReset.isSuccess;

  return (
    <div className="grid gap-6">
      <form className="grid gap-4 rounded-[22px] border border-slate-200 bg-slate-50/80 p-5" onSubmit={requestForm.handleSubmit((values) => requestReset.mutate(values))}>
        <div>
          <p className="font-heading text-xl font-semibold text-[#1F2937]">Request password reset code</p>
          <p className="mt-1 text-sm text-slate-600">We will send a reset code to the email linked to your account.</p>
        </div>
        {requestReset.isSuccess ? <Notice title={requestReset.data.detail} tone="success" /> : null}
        <ErrorMessage error={requestReset.error} context="auth" />
        <Field label="Email" error={requestForm.formState.errors.email?.message} required>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...requestForm.register("email")} />
        </Field>
        <Button type="submit" disabled={requestReset.isPending}>
          {requestReset.isPending ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <form className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)]" onSubmit={confirmForm.handleSubmit((values) => confirmReset.mutate(values))}>
        <div>
          <p className="font-heading text-xl font-semibold text-[#1F2937]">Set a new password</p>
          <p className="mt-1 text-sm text-slate-600">
            {resetCodeRequested ? "Paste the reset code from your email, then choose a new secure password." : "Request a reset code first, then return here to set your new password."}
          </p>
        </div>
        {confirmReset.isSuccess ? <Notice title={confirmReset.data.detail} tone="success" /> : null}
        <ErrorMessage error={confirmReset.error} context="auth" />
        <Field label="Reset code" error={confirmForm.formState.errors.token?.message} required>
          <Input placeholder="Paste your reset code" disabled={!resetCodeRequested} {...confirmForm.register("token")} />
        </Field>
        <Field label="New password" error={confirmForm.formState.errors.new_password?.message} required>
          <PasswordInput autoComplete="new-password" placeholder="Enter new password" disabled={!resetCodeRequested} {...confirmForm.register("new_password")} />
        </Field>
        <Button type="submit" variant="secondary" disabled={!resetCodeRequested || confirmReset.isPending}>
          {confirmReset.isPending ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
