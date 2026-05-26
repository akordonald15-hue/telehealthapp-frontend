"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { OtpInput } from "@/components/ui/otp-input";
import { authApi } from "@/lib/api/endpoints";
import { emailVerifySchema, type EmailVerifyInput } from "@/lib/validation/auth";

export function EmailVerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resendWait, setResendWait] = useState(30);
  const requestVerification = useMutation({ mutationFn: authApi.otpRequest });
  const confirmVerification = useMutation({ mutationFn: authApi.otpVerify });
  const confirmForm = useForm<EmailVerifyInput>({
    resolver: zodResolver(emailVerifySchema),
    defaultValues: { email, code: "" },
  });

  useEffect(() => {
    if (resendWait <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setResendWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendWait]);

  function resendCode() {
    const targetEmail = confirmForm.getValues("email");
    requestVerification.mutate(
      { email: targetEmail },
      {
        onSuccess: () => setResendWait(30),
      },
    );
  }

  return (
    <div className="grid gap-6">
      <Notice title="Check your email" tone="neutral">
        We sent a 6-digit code to {email || "your email"}. Enter it here to continue creating your Caretekk account.
      </Notice>

      <form
        className="grid gap-5 rounded-[22px] border border-ash-200 bg-surface p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)] sm:p-6"
        onSubmit={confirmForm.handleSubmit((values) =>
          confirmVerification.mutate(values, {
            onSuccess: () => router.replace(`/register?email=${encodeURIComponent(values.email)}&verified=1`),
          }),
        )}
      >
        <div>
          <p className="font-heading text-xl font-semibold text-ash-900">Enter your verification code</p>
          <p className="mt-1 text-sm text-ash-600">The code expires in 10 minutes.</p>
        </div>
        {confirmVerification.isSuccess ? (
          <div className="grid gap-3">
            <Notice title="Email confirmed" tone="success" />
            <p className="text-sm text-ash-600">Taking you to the final account step...</p>
          </div>
        ) : null}
        <ErrorMessage error={confirmVerification.error} context="auth" />
        <Field label="Email" error={confirmForm.formState.errors.email?.message} required>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...confirmForm.register("email")} />
        </Field>
        <div className="grid gap-2">
          <span className="text-sm font-bold text-ash-700">
            Verification code <span className="ml-1 text-rose-600" aria-hidden="true">*</span>
          </span>
          <Controller
            control={confirmForm.control}
            name="code"
            render={({ field, fieldState }) => (
              <OtpInput
                value={field.value}
                onChange={field.onChange}
                ariaInvalid={Boolean(fieldState.error)}
                disabled={confirmVerification.isPending}
              />
            )}
          />
          {confirmForm.formState.errors.code?.message ? (
            <span className="text-xs font-semibold text-rose-700">{confirmForm.formState.errors.code.message}</span>
          ) : (
            <span className="text-xs text-ash-500">Paste the 6-digit code from your email.</span>
          )}
        </div>
        <Button type="submit" disabled={confirmVerification.isPending}>
          {confirmVerification.isPending ? "Confirming..." : "Confirm email"}
        </Button>
        <div className="rounded-[16px] bg-ash-50 p-4 text-sm text-ash-600">
          <p>Didn&apos;t get it?</p>
          <button
            className="mt-2 font-semibold text-primary transition hover:text-primary-strong disabled:cursor-not-allowed disabled:text-ash-400"
            type="button"
            disabled={requestVerification.isPending || resendWait > 0}
            onClick={resendCode}
          >
            {requestVerification.isPending ? "Sending..." : resendWait > 0 ? `Resend code in ${resendWait}s` : "Resend code"}
          </button>
          {requestVerification.isSuccess ? <p className="mt-2 text-success">A fresh code has been sent.</p> : null}
          <ErrorMessage error={requestVerification.error} context="auth" />
        </div>
      </form>
    </div>
  );
}
