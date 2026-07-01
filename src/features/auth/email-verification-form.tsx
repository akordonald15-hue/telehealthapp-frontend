"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Notice } from "@/components/ui/notice";
import { OtpInput } from "@/components/ui/otp-input";
import {
  readPendingVerificationEmail,
  savePendingVerificationEmail,
  saveVerifiedRegistrationEmail,
} from "@/features/auth/email-flow-storage";
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
  const currentEmail = useWatch({ control: confirmForm.control, name: "email" });

  useEffect(() => {
    const resolvedEmail = email || readPendingVerificationEmail();
    if (!resolvedEmail) {
      router.replace("/register");
      return;
    }

    if (email) {
      savePendingVerificationEmail(email);
      router.replace("/verify-email");
      return;
    }

    if (confirmForm.getValues("email") !== resolvedEmail) {
      confirmForm.reset({ email: resolvedEmail, code: "" });
    }
  }, [confirmForm, email, router]);

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
        onSuccess: () => {
          savePendingVerificationEmail(targetEmail);
          setResendWait(30);
        },
      },
    );
  }

  return (
    <div className="grid gap-6">
      <Notice title="Check your email" tone="neutral">
        We sent a 6-digit code to {currentEmail || "your email"}. Enter it here to continue creating your Caretekk account.
      </Notice>

      <form
        className="grid gap-5 rounded-[22px] border border-ash-200 bg-surface p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)] sm:p-6"
        onSubmit={confirmForm.handleSubmit((values) =>
          confirmVerification.mutate(values, {
            onSuccess: () => {
              saveVerifiedRegistrationEmail(values.email);
              router.replace("/register?verified=1");
            },
          })
        )}
      >
        <div>
          <p className="font-heading text-xl font-semibold text-ash-900">Enter your verification code</p>
          <p className="mt-1 text-sm text-ash-600">The code expires in 10 minutes.</p>
        </div>

        {currentEmail ? (
          <div className="rounded-[16px] border border-ash-200 bg-ash-50 px-4 py-3 text-sm text-ash-700">
            <span className="font-semibold text-ash-900">Email:</span> {currentEmail}
          </div>
        ) : null}

        {confirmVerification.isSuccess ? (
          <div className="grid gap-3">
            <Notice title="Email confirmed" tone="success" />
            <p className="text-sm text-ash-600">Taking you to the final account step...</p>
          </div>
        ) : null}

        <ErrorMessage error={confirmVerification.error} context="verification" />

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
          <p className="mt-3 text-xs text-ash-500">Need a different email? Go back to sign up and request a new code.</p>
          {requestVerification.isSuccess ? <p className="mt-2 text-success">A fresh code has been sent.</p> : null}
          <ErrorMessage error={requestVerification.error} context="verification" />
        </div>
      </form>
    </div>
  );
}
