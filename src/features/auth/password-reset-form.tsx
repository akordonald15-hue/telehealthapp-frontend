"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Check, CircleX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { AuthPhotoPanel } from "@/components/layout/auth-photo-panel";
import { AuthSplitLayout } from "@/components/layout/auth-split-layout";
import {
  AuthAlert,
  AuthButton,
  AuthCard,
  AuthErrorAlert,
  AuthField,
  AuthInput,
  AuthPasswordInput,
} from "@/features/auth/auth-ui";
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
const PANEL_IMAGES = ["/img/Dr michael Idam.jpg", "/img/Dr effiong Okon.jpg"] as const;

const backStyles =
  "type-body-lg! mx-auto flex h-10 w-fit items-center rounded-lg px-4 text-primary-500 underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60";

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

  const [requestEmail] = useWatch({ control: requestForm.control, name: ["email"] });
  const [otpCode] = useWatch({ control: otpForm.control, name: ["code"] });
  const [newPassword, confirmPassword] = useWatch({
    control: passwordForm.control,
    name: ["new_password", "confirm_password"],
  });

  const emphasisedEmail = <span className="font-semibold text-black-500">{email}</span>;
  const subtitle =
    step === "email" ? (
      "We would send you reset instructions"
    ) : step === "otp" ? (
      <>We&apos;ve sent you a code to {emphasisedEmail}</>
    ) : (
      <>Choose a new password for {emphasisedEmail}</>
    );

  return (
    <>
      <AuthSplitLayout
        panelSide="right"
        panel={<AuthPhotoPanel images={PANEL_IMAGES} active={step === "email" ? 0 : 1} />}
        inert={step === "success"}
      >
        <AuthCard align="start" title="Forgot Password" subtitle={subtitle}>
          {step === "email" ? (
            <form className="grid gap-6" onSubmit={requestForm.handleSubmit((values) => requestReset.mutate(values))}>
              {requestReset.isSuccess ? <AuthAlert tone="success">{requestReset.data.detail}</AuthAlert> : null}
              <AuthErrorAlert error={requestReset.error} context="auth" />
              <AuthField label="Email" error={requestForm.formState.errors.email?.message} required>
                <AuthInput type="email" autoComplete="email" placeholder="Input your email" {...requestForm.register("email")} />
              </AuthField>
              <AuthButton type="submit" disabled={requestReset.isPending} inactive={!requestEmail}>
                {requestReset.isPending ? "Sending code..." : "Continue"}
              </AuthButton>
              <Link href="/login" className={backStyles}>
                Back
              </Link>
            </form>
          ) : null}

          {step === "otp" ? (
            <form className="grid gap-6" onSubmit={otpForm.handleSubmit((values) => verifyReset.mutate(values))}>
              <AuthErrorAlert error={verifyReset.error} context="verification" />
              <AuthField label="Input code" error={otpForm.formState.errors.code?.message} required>
                <AuthInput
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Input the 6-digit code"
                  maxLength={6}
                  {...otpForm.register("code")}
                />
              </AuthField>
              <AuthButton type="submit" disabled={verifyReset.isPending} inactive={!otpCode}>
                {verifyReset.isPending ? "Verifying..." : "Continue"}
              </AuthButton>
              <button type="button" className={backStyles} onClick={() => setStep("email")} disabled={verifyReset.isPending}>
                Back
              </button>
            </form>
          ) : null}

          {step === "password" || step === "success" ? (
            <form className="grid gap-6" onSubmit={passwordForm.handleSubmit((values) => confirmReset.mutate(values))}>
              <AuthErrorAlert error={confirmReset.error} context="auth" />
              <input type="hidden" {...passwordForm.register("reset_token")} />
              <div className="grid gap-3">
                <AuthField label="New password" error={passwordForm.formState.errors.new_password?.message} required>
                  <AuthPasswordInput
                    autoComplete="new-password"
                    placeholder="Input your new password"
                    {...passwordForm.register("new_password")}
                  />
                </AuthField>
                <AuthField label="Confirm password" error={passwordForm.formState.errors.confirm_password?.message} required>
                  <AuthPasswordInput
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    {...passwordForm.register("confirm_password")}
                  />
                </AuthField>
              </div>
              <AuthButton type="submit" disabled={confirmReset.isPending} inactive={!newPassword || !confirmPassword}>
                {confirmReset.isPending ? "Updating password..." : "Continue"}
              </AuthButton>
              <button type="button" className={backStyles} onClick={() => setStep("otp")} disabled={confirmReset.isPending}>
                Back
              </button>
            </form>
          ) : null}
        </AuthCard>
      </AuthSplitLayout>

      {step === "success" ? <PasswordUpdatedDialog onLogin={() => router.push("/login")} /> : null}
    </>
  );
}

function PasswordUpdatedDialog({ onLogin }: { onLogin: () => void }) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onLogin();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onLogin]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-900/15 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="ct-pop-in relative w-full max-w-[450px] rounded-2xl border-[10px] border-grey-200 bg-white px-5 pb-[60px] pt-[46px] text-center sm:px-7.5"
      >
        <button
          type="button"
          onClick={onLogin}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full text-black-500 transition-colors hover:text-primary-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200 sm:right-[30px] sm:top-[40px]"
        >
          <CircleX className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <span className="mx-auto flex h-22 w-22 items-center justify-center rounded-full bg-success-50 text-success-500">
          <Check className="h-8 w-8" strokeWidth={2.5} />
        </span>
        <div className="mx-auto mt-6 grid max-w-[286px] gap-2">
          <h2 id={titleId} className="type-page-title text-black-500">
            Password updated successfully
          </h2>
          <p id={descriptionId} className="type-body-lg text-grey-500">
            Your password has been updated, please login
          </p>
        </div>
        <AuthButton type="button" autoFocus onClick={onLogin} className="mt-12">
          Login
        </AuthButton>
      </div>
    </div>
  );
}
