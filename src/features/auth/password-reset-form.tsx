"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, PasswordInput } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { authApi } from "@/lib/api/endpoints";
import {
  emailSchema,
  otpCodeSchema,
  passwordResetConfirmSchema,
  type EmailInput,
  type OtpCodeInput,
  type PasswordResetConfirmInput,
} from "@/lib/validation/auth";

const RESET_EMAIL_STORAGE_KEY = "caretekk-password-reset-email";
const RESET_TOKEN_STORAGE_KEY = "caretekk-password-reset-token";

type ResetStep = "email" | "otp" | "password" | "success";

export function PasswordResetForm() {
  const router = useRouter();
  const [storedResetState] = useState(() => {
    if (typeof window === "undefined") {
      return { email: "", resetToken: "" };
    }
    return {
      email: window.sessionStorage.getItem(RESET_EMAIL_STORAGE_KEY) || "",
      resetToken: window.sessionStorage.getItem(RESET_TOKEN_STORAGE_KEY) || "",
    };
  });
  const [step, setStep] = useState<ResetStep>(
    storedResetState.resetToken ? "password" : storedResetState.email ? "otp" : "email",
  );
  const [email, setEmail] = useState(storedResetState.email);

  const requestForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: storedResetState.email },
  });
  const otpForm = useForm<OtpCodeInput>({
    resolver: zodResolver(otpCodeSchema),
    defaultValues: { code: "" },
  });
  const passwordForm = useForm<PasswordResetConfirmInput>({
    resolver: zodResolver(passwordResetConfirmSchema),
    defaultValues: { reset_token: storedResetState.resetToken, new_password: "", confirm_password: "" },
  });

  const requestReset = useMutation({
    mutationFn: authApi.passwordResetRequest,
    onSuccess: (_data, values) => {
      setEmail(values.email);
      setStep("otp");
      otpForm.reset({ code: "" });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(RESET_EMAIL_STORAGE_KEY, values.email);
        window.sessionStorage.removeItem(RESET_TOKEN_STORAGE_KEY);
      }
    },
  });

  const verifyReset = useMutation({
    mutationFn: (values: OtpCodeInput) => authApi.passwordResetVerify({ email, code: values.code }),
    onSuccess: (data) => {
      setStep("password");
      passwordForm.reset({
        reset_token: data.reset_token,
        new_password: "",
        confirm_password: "",
      });
      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(RESET_TOKEN_STORAGE_KEY, data.reset_token);
      }
    },
  });

  const confirmReset = useMutation({
    mutationFn: authApi.passwordResetConfirm,
    onSuccess: () => {
      setStep("success");
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem(RESET_EMAIL_STORAGE_KEY);
        window.sessionStorage.removeItem(RESET_TOKEN_STORAGE_KEY);
      }
      window.setTimeout(() => {
        router.push("/login");
      }, 1200);
    },
  });

  const stepIndex = useMemo(() => ({ email: 1, otp: 2, password: 3, success: 3 }[step]), [step]);

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-3 rounded-[22px] border border-ash-200 bg-ash-50/80 px-4 py-3 text-sm text-ash-700">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
          {stepIndex}
        </span>
        <div>
          <p className="font-medium text-ash-900">
            {step === "email" && "Step 1 of 3: Request reset code"}
            {step === "otp" && "Step 2 of 3: Verify reset code"}
            {step === "password" && "Step 3 of 3: Set new password"}
            {step === "success" && "Password updated"}
          </p>
          <p className="text-xs text-ash-600">Caretekk uses a secure reset code for this flow.</p>
        </div>
      </div>

      {step === "email" ? (
        <form
          className="grid gap-4 rounded-[22px] border border-ash-200 bg-ash-50/80 p-5 sm:p-6"
          onSubmit={requestForm.handleSubmit((values) => requestReset.mutate(values))}
        >
          <div>
            <p className="font-heading text-xl font-semibold text-ash-900">Request reset code</p>
            <p className="mt-1 text-sm text-ash-600">
              Enter the email on your Caretekk account. If it exists, we’ll send a secure reset code.
            </p>
          </div>
          {requestReset.isSuccess ? <Notice title={requestReset.data.detail} tone="success" /> : null}
          <ErrorMessage error={requestReset.error} context="auth" />
          <Field label="Email" error={requestForm.formState.errors.email?.message} required>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...requestForm.register("email")} />
          </Field>
          <Button type="submit" disabled={requestReset.isPending}>
            {requestReset.isPending ? "Sending code..." : "Send reset code"}
          </Button>
        </form>
      ) : null}

      {step === "otp" ? (
        <form
          className="grid gap-4 rounded-[22px] border border-ash-200 bg-surface p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)] sm:p-6"
          onSubmit={otpForm.handleSubmit((values) => verifyReset.mutate(values))}
        >
          <div>
            <p className="font-heading text-xl font-semibold text-ash-900">Verify reset code</p>
            <p className="mt-1 text-sm text-ash-600">
              Enter the 6-digit code sent to <span className="font-medium text-ash-900">{email}</span>.
            </p>
          </div>
          <ErrorMessage error={verifyReset.error} context="verification" />
          <Field label="Reset code" error={otpForm.formState.errors.code?.message} required>
            <Input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit code"
              maxLength={6}
              {...otpForm.register("code")}
            />
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => setStep("email")} disabled={verifyReset.isPending}>
              Back
            </Button>
            <Button type="submit" disabled={verifyReset.isPending}>
              {verifyReset.isPending ? "Verifying..." : "Verify code"}
            </Button>
          </div>
        </form>
      ) : null}

      {step === "password" ? (
        <form
          className="grid gap-4 rounded-[22px] border border-ash-200 bg-surface p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)] sm:p-6"
          onSubmit={passwordForm.handleSubmit((values) => confirmReset.mutate(values))}
        >
          <div>
            <p className="font-heading text-xl font-semibold text-ash-900">Set a new password</p>
            <p className="mt-1 text-sm text-ash-600">
              Choose a new password for <span className="font-medium text-ash-900">{email}</span>.
            </p>
          </div>
          <ErrorMessage error={confirmReset.error} context="auth" />
          <input type="hidden" {...passwordForm.register("reset_token")} />
          <Field label="New password" error={passwordForm.formState.errors.new_password?.message} required>
            <PasswordInput autoComplete="new-password" placeholder="Enter new password" {...passwordForm.register("new_password")} />
          </Field>
          <Field label="Confirm password" error={passwordForm.formState.errors.confirm_password?.message} required>
            <PasswordInput autoComplete="new-password" placeholder="Confirm new password" {...passwordForm.register("confirm_password")} />
          </Field>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" variant="secondary" onClick={() => setStep("otp")} disabled={confirmReset.isPending}>
              Back
            </Button>
            <Button type="submit" disabled={confirmReset.isPending}>
              {confirmReset.isPending ? "Updating password..." : "Update password"}
            </Button>
          </div>
        </form>
      ) : null}

      {step === "success" ? (
        <Notice title="Your password has been updated." tone="success">
          Redirecting you to sign in now.
        </Notice>
      ) : null}

      <p className="text-center text-sm text-ash-600">
        Remembered your password?{" "}
        <Link className="font-semibold text-primary hover:text-primary-strong" href="/login">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
