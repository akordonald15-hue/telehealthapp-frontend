"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, PasswordInput } from "@/components/ui/input";
import { GoogleAuthButton } from "@/features/auth/google-auth-button";
import {
  clearPendingVerificationEmail,
  clearVerifiedRegistrationEmail,
  readPendingVerificationEmail,
  readVerifiedRegistrationEmail,
  savePendingVerificationEmail,
} from "@/features/auth/email-flow-storage";
import {
  clearPendingReferralCode,
  normalizeReferralCode,
  readPendingReferralCode,
} from "@/features/referral-program/referral-code-storage";
import { authApi } from "@/lib/api/endpoints";
import { normalizeNigerianPhoneInput } from "@/lib/validation/phone";
import {
  emailSchema,
  registerSchema,
  type EmailInput,
  type RegisterInput,
} from "@/lib/validation/auth";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  // A code can arrive on the URL (?ref=) or from a /r/<code> visit earlier in this session.
  const referralCodeFromUrl = normalizeReferralCode(searchParams.get("ref"));
  const [referralOutcome, setReferralOutcome] = useState<{ applied: boolean; detail: string } | null>(null);
  const isCompletingAccount = searchParams.get("verified") === "1";
  const requestCode = useMutation({ mutationFn: authApi.otpRequest });
  const register = useMutation({ mutationFn: authApi.register });
  const emailForm = useForm<EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: initialEmail },
  });
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: initialEmail,
      phone: "",
      password: "",
      referral_code: referralCodeFromUrl || readPendingReferralCode(),
    },
  });

  useEffect(() => {
    if (!isCompletingAccount) {
      if (initialEmail) {
        savePendingVerificationEmail(initialEmail);
        router.replace("/verify-email");
        return;
      }

      const storedEmail = readPendingVerificationEmail();
      if (storedEmail && emailForm.getValues("email") !== storedEmail) {
        emailForm.reset({ email: storedEmail });
      }
      return;
    }

    const verifiedEmail = initialEmail || readVerifiedRegistrationEmail();
    if (!verifiedEmail) {
      router.replace("/register");
      return;
    }

    if (initialEmail) {
      router.replace("/register?verified=1");
      return;
    }

    if (form.getValues("email") !== verifiedEmail) {
      form.reset({
        email: verifiedEmail,
        phone: form.getValues("phone"),
        password: form.getValues("password"),
        referral_code: form.getValues("referral_code") || referralCodeFromUrl || readPendingReferralCode(),
      });
    }
  }, [emailForm, form, initialEmail, isCompletingAccount, referralCodeFromUrl, router]);

  return (
    <div className="grid gap-5">
      <GoogleAuthButton mode="signup" />
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ash-400">
        <span className="h-px flex-1 bg-ash-200" />
        <span>{isCompletingAccount ? "Finish creating your account" : "Or continue with email"}</span>
        <span className="h-px flex-1 bg-ash-200" />
      </div>

      {!isCompletingAccount ? (
        <form
          className="grid gap-5"
          onSubmit={emailForm.handleSubmit((values) =>
            requestCode.mutate(values, {
              onSuccess: () => {
                clearVerifiedRegistrationEmail();
                savePendingVerificationEmail(values.email);
                router.replace("/verify-email");
              },
            }),
          )}
        >
          <ErrorMessage error={requestCode.error} context="verification" />
          <Field label="Email" error={emailForm.formState.errors.email?.message} required>
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...emailForm.register("email")} />
          </Field>
          <Button type="submit" disabled={requestCode.isPending}>
            {requestCode.isPending ? "Sending your code..." : "Create account"}
          </Button>
        </form>
      ) : null}

      {isCompletingAccount ? (
        <form
          className="grid gap-5"
          onSubmit={form.handleSubmit((values) => {
            const referralCode = normalizeReferralCode(values.referral_code);
            register.mutate(
              {
                ...values,
                phone: normalizeNigerianPhoneInput(values.phone ?? "") ?? values.phone?.trim(),
                ...(referralCode ? { referral_code: referralCode } : {}),
              },
              {
                onSuccess: (response) => {
                  clearPendingVerificationEmail();
                  clearVerifiedRegistrationEmail();
                  clearPendingReferralCode();
                  // The backend creates the account even when the code cannot be applied, so a
                  // refusal is reported rather than treated as a signup failure.
                  if (referralCode && response?.referral && !response.referral.applied) {
                    setReferralOutcome(response.referral);
                    return;
                  }
                  router.replace("/login");
                },
              },
            );
          })}
        >
          <ErrorMessage error={register.error} context="registration" />
          <Field label="Email" error={form.formState.errors.email?.message} required>
            <Input type="email" autoComplete="email" placeholder="you@example.com" readOnly {...form.register("email")} />
          </Field>
          <Field label="Phone" error={form.formState.errors.phone?.message} required>
            <Input type="tel" autoComplete="tel" placeholder="08012345678 or +2348012345678" {...form.register("phone")} />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message} hint="Minimum 8 characters" required>
            <PasswordInput autoComplete="new-password" placeholder="Create a secure password" {...form.register("password")} />
          </Field>
          <Field
            label="Referral code (optional)"
            error={form.formState.errors.referral_code?.message}
            hint="Pre-filled if you arrived from an invite link. You can change or remove it."
          >
            <Input
              placeholder="e.g. DONALD7K3Q"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              {...form.register("referral_code")}
            />
          </Field>
          <Button type="submit" disabled={register.isPending}>
            {register.isPending ? "Creating your account..." : "Create account"}
          </Button>
        </form>
      ) : null}

      {referralOutcome && !referralOutcome.applied ? (
        <div className="grid gap-3 rounded-[8px] border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900">Your account was created</p>
          <p className="text-sm text-amber-800">
            {referralOutcome.detail || "That referral code could not be applied."} You can add a referral code from
            Refer &amp; Earn after signing in.
          </p>
          <Button type="button" onClick={() => router.replace("/login")}>
            Continue to sign in
          </Button>
        </div>
      ) : null}

      <p className="text-center text-sm text-ash-600">
        Already have an account?{" "}
        <Link className="font-semibold text-primary hover:text-primary-strong" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
