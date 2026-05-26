"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, PasswordInput } from "@/components/ui/input";
import { GoogleAuthButton } from "@/features/auth/google-auth-button";
import { authApi } from "@/lib/api/endpoints";
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
  const isCompletingAccount = searchParams.get("verified") === "1" && Boolean(initialEmail);
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
    },
  });

  const googleConfigured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

  return (
    <div className="grid gap-5">
      {googleConfigured ? (
        <>
          <GoogleAuthButton mode="signup" />
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ash-400">
            <span className="h-px flex-1 bg-ash-200" />
            <span>{isCompletingAccount ? "Finish creating your account" : "Or continue with email"}</span>
            <span className="h-px flex-1 bg-ash-200" />
          </div>
        </>
      ) : null}

      {!isCompletingAccount ? (
        <form
          className="grid gap-5"
          onSubmit={emailForm.handleSubmit((values) =>
            requestCode.mutate(values, {
              onSuccess: () => router.replace(`/verify-email?email=${encodeURIComponent(values.email)}`),
            }),
          )}
        >
          <ErrorMessage error={requestCode.error} context="auth" />
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
          onSubmit={form.handleSubmit((values) =>
            register.mutate(values, {
              onSuccess: () => router.replace(`/login?email=${encodeURIComponent(values.email)}`),
            }),
          )}
        >
          <ErrorMessage error={register.error} context="auth" />
          <Field label="Email" error={form.formState.errors.email?.message} required>
            <Input type="email" autoComplete="email" placeholder="you@example.com" readOnly {...form.register("email")} />
          </Field>
          <Field label="Phone" error={form.formState.errors.phone?.message} required>
            <Input type="tel" autoComplete="tel" placeholder="+234..." {...form.register("phone")} />
          </Field>
          <Field label="Password" error={form.formState.errors.password?.message} hint="Minimum 8 characters" required>
            <PasswordInput autoComplete="new-password" placeholder="Create a secure password" {...form.register("password")} />
          </Field>
          <Button type="submit" disabled={register.isPending}>
            {register.isPending ? "Creating your account..." : "Create account"}
          </Button>
        </form>
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
