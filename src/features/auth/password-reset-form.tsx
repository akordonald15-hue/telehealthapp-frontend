"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { CircleCheck, KeyRound, LockKeyhole, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

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
import { cn } from "@/lib/utils";
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
  const [requestEmail] = useWatch({ control: requestForm.control, name: ["email"] });
  const [otpCode] = useWatch({ control: otpForm.control, name: ["code"] });
  const [newPassword, confirmPassword] = useWatch({
    control: passwordForm.control,
    name: ["new_password", "confirm_password"],
  });

  const header = {
    email: {
      icon: <KeyRound className="h-5 w-5" />,
      title: "Forgot password?",
      subtitle: "Enter the email on your Caretekk account. If it exists, we’ll send a secure reset code.",
    },
    otp: {
      icon: <MailCheck className="h-5 w-5" />,
      title: "Verify reset code",
      subtitle: (
        <>
          Enter the 6-digit code sent to <span className="text-grey-900">{email}</span>.
        </>
      ),
    },
    password: {
      icon: <LockKeyhole className="h-5 w-5" />,
      title: "Set a new password",
      subtitle: (
        <>
          Choose a new password for <span className="text-grey-900">{email}</span>.
        </>
      ),
    },
    success: {
      icon: <CircleCheck className="h-5 w-5 text-success-500" />,
      title: "Password updated",
      subtitle: "You can now sign in with your new password.",
    },
  }[step];

  return (
    <AuthCard icon={header.icon} title={header.title} subtitle={header.subtitle}>
      <div className="mb-6">
        <div className="flex gap-1.5" aria-hidden="true">
          {[1, 2, 3].map((index) => (
            <span
              key={index}
              className={cn("h-1 flex-1 rounded-full transition-colors", index <= stepIndex ? "bg-primary-500" : "bg-grey-200")}
            />
          ))}
        </div>
        <p className="type-body-sm mt-2 text-grey-500">
          {step === "email" && "Step 1 of 3: Request reset code"}
          {step === "otp" && "Step 2 of 3: Verify reset code"}
          {step === "password" && "Step 3 of 3: Set new password"}
          {step === "success" && "Password updated"}
        </p>
      </div>

      {step === "email" ? (
        <form className="grid gap-5" onSubmit={requestForm.handleSubmit((values) => requestReset.mutate(values))}>
          {requestReset.isSuccess ? <AuthAlert tone="success">{requestReset.data.detail}</AuthAlert> : null}
          <AuthErrorAlert error={requestReset.error} context="auth" />
          <AuthField label="Email" error={requestForm.formState.errors.email?.message} required>
            <AuthInput type="email" autoComplete="email" placeholder="Input your Email" {...requestForm.register("email")} />
          </AuthField>
          <AuthButton type="submit" disabled={requestReset.isPending} inactive={!requestEmail}>
            {requestReset.isPending ? "Sending code..." : "Send reset code"}
          </AuthButton>
        </form>
      ) : null}

      {step === "otp" ? (
        <form className="grid gap-5" onSubmit={otpForm.handleSubmit((values) => verifyReset.mutate(values))}>
          <AuthErrorAlert error={verifyReset.error} context="verification" />
          <AuthField label="Reset code" error={otpForm.formState.errors.code?.message} required>
            <AuthInput
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="tracking-[0.3em] placeholder:tracking-normal"
              {...otpForm.register("code")}
            />
          </AuthField>
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <AuthButton type="button" variant="secondary" onClick={() => setStep("email")} disabled={verifyReset.isPending}>
              Back
            </AuthButton>
            <AuthButton type="submit" disabled={verifyReset.isPending} inactive={!otpCode}>
              {verifyReset.isPending ? "Verifying..." : "Verify code"}
            </AuthButton>
          </div>
        </form>
      ) : null}

      {step === "password" ? (
        <form className="grid gap-5" onSubmit={passwordForm.handleSubmit((values) => confirmReset.mutate(values))}>
          <AuthErrorAlert error={confirmReset.error} context="auth" />
          <input type="hidden" {...passwordForm.register("reset_token")} />
          <AuthField label="New password" error={passwordForm.formState.errors.new_password?.message} required>
            <AuthPasswordInput autoComplete="new-password" placeholder="Enter new password" {...passwordForm.register("new_password")} />
          </AuthField>
          <AuthField label="Confirm password" error={passwordForm.formState.errors.confirm_password?.message} required>
            <AuthPasswordInput autoComplete="new-password" placeholder="Confirm new password" {...passwordForm.register("confirm_password")} />
          </AuthField>
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <AuthButton type="button" variant="secondary" onClick={() => setStep("otp")} disabled={confirmReset.isPending}>
              Back
            </AuthButton>
            <AuthButton type="submit" disabled={confirmReset.isPending} inactive={!newPassword || !confirmPassword}>
              {confirmReset.isPending ? "Updating password..." : "Update password"}
            </AuthButton>
          </div>
        </form>
      ) : null}

      {step === "success" ? (
        <AuthAlert tone="success">Your password has been updated. Redirecting you to sign in now.</AuthAlert>
      ) : null}

      <p className="type-body-sm mt-6 text-center text-grey-600">
        Remembered your password?{" "}
        <Link className="text-primary-500 underline underline-offset-2 transition hover:text-primary-600" href="/login">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
