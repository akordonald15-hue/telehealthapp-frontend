"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
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
        className="grid gap-4 rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)]"
        onSubmit={confirmForm.handleSubmit((values) =>
          confirmVerification.mutate(values, {
            onSuccess: () => router.replace(`/register?email=${encodeURIComponent(values.email)}&verified=1`),
          }),
        )}
      >
        <div>
          <p className="font-heading text-xl font-semibold text-[#1F2937]">Enter your verification code</p>
          <p className="mt-1 text-sm text-slate-600">The code expires in 10 minutes.</p>
        </div>
        {confirmVerification.isSuccess ? (
          <div className="grid gap-3">
            <Notice title="Email confirmed" tone="success" />
            <p className="text-sm text-slate-600">Taking you to the final account step...</p>
          </div>
        ) : null}
        <ErrorMessage error={confirmVerification.error} context="auth" />
        <Field label="Email" error={confirmForm.formState.errors.email?.message} required>
          <Input type="email" autoComplete="email" placeholder="you@example.com" {...confirmForm.register("email")} />
        </Field>
        <Field label="Verification code" error={confirmForm.formState.errors.code?.message} required>
          <Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            {...confirmForm.register("code")}
          />
        </Field>
        <Button type="submit" variant="secondary" disabled={confirmVerification.isPending}>
          {confirmVerification.isPending ? "Confirming..." : "Confirm email"}
        </Button>
        <div className="rounded-[16px] bg-slate-50 p-4 text-sm text-slate-600">
          <p>Didn&apos;t get it?</p>
          <button
            className="mt-2 font-semibold text-[#2563EB] disabled:cursor-not-allowed disabled:text-slate-400"
            type="button"
            disabled={requestVerification.isPending || resendWait > 0}
            onClick={resendCode}
          >
            {requestVerification.isPending ? "Sending..." : resendWait > 0 ? `Resend code in ${resendWait}s` : "Resend code"}
          </button>
          {requestVerification.isSuccess ? <p className="mt-2 text-[#047857]">A fresh code has been sent.</p> : null}
          <ErrorMessage error={requestVerification.error} context="auth" />
        </div>
      </form>
    </div>
  );
}
