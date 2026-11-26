"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ds/button";

import { authApi } from "@/lib/api/endpoints";
import {
  clearPendingVerificationEmail,
  clearVerifiedRegistrationEmail,
  readPendingVerificationEmail,
  readVerifiedRegistrationEmail,
  savePendingVerificationEmail,
  saveVerifiedRegistrationEmail,
} from "@/features/auth/email-flow-storage";
import {
  clearPendingReferralCode,
  normalizeReferralCode,
  readPendingReferralCode,
  savePendingReferralCode,
} from "@/features/referral-program/referral-code-storage";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { normalizeNigerianPhoneInput } from "@/lib/validation/phone";

import type { SignupAccountInput, SignupEmailInput } from "./signup-schema";
import { SignupCard } from "./signup-card";
import { SignupAccountForm, SignupEmailForm } from "./signup-form";
import { SignupOtpStep } from "./signup-otp-step";

type Stage = "email" | "otp" | "account" | "referral";

const stageCopy: Record<Stage, { title: string; subtitle: string }> = {
  email: { title: "Create a new account", subtitle: "Please kindly input your details" },
  otp: { title: "Confirm your email", subtitle: "Enter the code we sent to your inbox" },
  account: { title: "Create a new account", subtitle: "Please kindly input your details" },
  referral: { title: "Account created", subtitle: "You can continue to sign in" },
};

export function SignupFlow({
  verified = false,
  emailFromUrl = "",
  referralFromUrl = "",
}: {
  verified?: boolean;
  emailFromUrl?: string;
  referralFromUrl?: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(verified ? "account" : "email");
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [referral, setReferral] = useState("");
  const [referralOutcome, setReferralOutcome] = useState<{ applied: boolean; detail: string } | null>(null);
  const [resendWait, setResendWait] = useState(0);

  const requestOtp = (values: { email: string }) => authApi.otpRequest(values);
  const requestCode = useMutation({ mutationFn: requestOtp });
  const resendCode = useMutation({ mutationFn: requestOtp });
  const verifyCode = useMutation({
    mutationFn: (values: { email: string; code: string }) => authApi.otpVerify(values),
  });
  const register = useMutation({ mutationFn: (values: Parameters<typeof authApi.register>[0]) => authApi.register(values) });

  // This effect synchronizes with sessionStorage and the URL; restoring here avoids
  // reading browser storage during server rendering (same pattern as use-form-draft).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (referralFromUrl) {
      savePendingReferralCode(referralFromUrl);
    }

    if (verified) {
      const verifiedEmail = emailFromUrl || readVerifiedRegistrationEmail();
      if (!verifiedEmail) {
        router.replace("/register");
        return;
      }
      setEmail(verifiedEmail);
      setReferral(normalizeReferralCode(referralFromUrl) || readPendingReferralCode());
      setReady(true);
      return;
    }

    if (emailFromUrl) {
      clearVerifiedRegistrationEmail();
      savePendingVerificationEmail(emailFromUrl);
    }

    const pendingEmail = emailFromUrl || readPendingVerificationEmail();
    if (pendingEmail) {
      setEmail(pendingEmail);
      setStage("otp");
      setResendWait(30);
    }

    setReferral(normalizeReferralCode(referralFromUrl) || readPendingReferralCode());
    setReady(true);
  }, [emailFromUrl, referralFromUrl, router, verified]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (resendWait <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setResendWait((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendWait]);

  function handleEmail(values: SignupEmailInput) {
    requestCode.mutate(
      { email: values.email },
      {
        onSuccess: () => {
          clearVerifiedRegistrationEmail();
          savePendingVerificationEmail(values.email);
          setEmail(values.email);
          setStage("otp");
          setResendWait(30);
        },
      },
    );
  }

  function handleVerify(code: string) {
    verifyCode.mutate(
      { email, code },
      {
        onSuccess: () => {
          saveVerifiedRegistrationEmail(email);
          setStage("account");
          router.replace("/register?verified=1");
        },
      },
    );
  }

  function handleResend() {
    resendCode.mutate(
      { email },
      {
        onSuccess: () => setResendWait(30),
      },
    );
  }

  function handleChangeEmail() {
    clearPendingVerificationEmail();
    requestCode.reset();
    resendCode.reset();
    verifyCode.reset();
    setEmail("");
    setResendWait(0);
    setStage("email");
  }

  function handleAccount(values: SignupAccountInput) {
    const referralCode = normalizeReferralCode(values.referral);
    register.mutate(
      {
        email: values.email,
        password: values.password,
        phone: normalizeNigerianPhoneInput(values.phone) ?? values.phone.trim(),
        ...(referralCode ? { referral_code: referralCode } : {}),
      },
      {
        onSuccess: (response) => {
          clearPendingVerificationEmail();
          clearVerifiedRegistrationEmail();
          clearPendingReferralCode();
          if (referralCode && response?.referral && !response.referral.applied) {
            setReferralOutcome(response.referral);
            setStage("referral");
            return;
          }
          router.replace("/login");
        },
      },
    );
  }

  const copy = stageCopy[stage];

  return (
    <SignupCard title={copy.title} subtitle={copy.subtitle}>
      {!ready && stage === "account" ? (
        <p className="sr-only">Loading your details</p>
      ) : null}

      {stage === "email" ? (
        <SignupEmailForm
          initialEmail={emailFromUrl}
          isSubmitting={requestCode.isPending}
          serverError={
            requestCode.error ? getFriendlyErrorMessage(requestCode.error, "verification") : undefined
          }
          onValid={handleEmail}
        />
      ) : null}

      {stage === "otp" ? (
        <SignupOtpStep
          email={email}
          serverError={
            verifyCode.error
              ? getFriendlyErrorMessage(verifyCode.error, "verification")
              : resendCode.error
                ? getFriendlyErrorMessage(resendCode.error, "verification")
                : undefined
          }
          isVerifying={verifyCode.isPending}
          isResending={resendCode.isPending}
          resendWait={resendWait}
          resendSent={resendCode.isSuccess}
          onChangeEmail={handleChangeEmail}
          onResend={handleResend}
          onVerify={handleVerify}
        />
      ) : null}

      {stage === "account" && ready ? (
        <SignupAccountForm
          key={`${email}-${referral}`}
          defaultValues={{
            email,
            password: "",
            phone: "",
            referral,
            terms: false,
          }}
          isSubmitting={register.isPending}
          serverError={register.error ? getFriendlyErrorMessage(register.error, "registration") : undefined}
          onValid={handleAccount}
        />
      ) : null}

      {stage === "referral" && referralOutcome ? (
        <div className="grid gap-4 rounded-lg border border-grey-200 bg-grey-50 p-4">
          <p className="type-body-md font-medium text-black-500">Your account was created</p>
          <p className="type-body-md text-grey-500">
            {referralOutcome.detail || "That referral code could not be applied."} You can add a referral code
            from Refer &amp; Earn after signing in.
          </p>
          <Button type="button" size="xl" className="w-full" onClick={() => router.replace("/login")}>
            Continue to sign in
          </Button>
        </div>
      ) : null}
    </SignupCard>
  );
}
