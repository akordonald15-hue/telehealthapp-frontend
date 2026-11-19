"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  AuthButton,
  AuthCheckbox,
  AuthDivider,
  AuthErrorAlert,
  AuthField,
  AuthInput,
  AuthPasswordInput,
  authButtonStyles,
} from "@/features/auth/auth-ui";
import { GoogleAuthButton } from "@/features/auth/google-auth-button";
import { savePendingVerificationEmail } from "@/features/auth/email-flow-storage";
import { useLogin } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage, isInvalidCredentialsError } from "@/lib/ui/error-copy";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export function LoginForm() {
  const login = useLogin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (!searchParams.get("password")) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("password");
    const nextUrl = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
    router.replace(nextUrl);
  }, [pathname, router, searchParams]);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email,
      password: "",
    },
  });

  const [emailValue, passwordValue] = useWatch({ control: form.control, name: ["email", "password"] });
  const credentialsRejected = isInvalidCredentialsError(login.error);
  const showCredentialsError =
    credentialsRejected && login.variables?.email === emailValue && login.variables?.password === passwordValue;
  const passwordError =
    form.formState.errors.password?.message ??
    (showCredentialsError ? getFriendlyErrorMessage(login.error, "auth") : undefined);

  return (
    <form
      onSubmit={form.handleSubmit((values) => {
        if (typeof window !== "undefined") {
          window.sessionStorage.setItem("caretekk:last-login-email", values.email);
        }
        login.mutate(values);
      })}
    >
      {login.error && !credentialsRejected ? (
        <div className="mb-5 grid gap-3">
          <AuthErrorAlert error={login.error} context="auth" />
          {login.error instanceof Error && login.error.message.toLowerCase().includes("email not verified") ? (
            <Link
              href="/verify-email"
              className={authButtonStyles({ variant: "secondary" })}
              onClick={() => {
                const targetEmail = form.getValues("email");
                if (targetEmail) {
                  savePendingVerificationEmail(targetEmail);
                }
              }}
            >
              Confirm email
            </Link>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4">
        <AuthField label="Email" error={form.formState.errors.email?.message} required>
          <AuthInput type="email" autoComplete="email" placeholder="Input your Email" {...form.register("email")} />
        </AuthField>
        <AuthField label="Password" error={passwordError} required>
          <AuthPasswordInput autoComplete="current-password" placeholder="Input your password" {...form.register("password")} />
        </AuthField>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <AuthCheckbox label="Remember me" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
        <Link
          href="/password-reset"
          className="type-body-sm text-grey-700 underline underline-offset-2 transition hover:text-primary-500"
        >
          Forgot password?
        </Link>
      </div>

      <AuthButton
        type="submit"
        className="mt-5"
        disabled={login.isPending}
        inactive={!emailValue || !passwordValue || showCredentialsError}
      >
        {login.isPending ? "Signing in..." : "Sign in"}
      </AuthButton>

      <div className="mt-6">
        <AuthDivider label="Or login with" />
      </div>

      <div className="mt-5">
        <GoogleAuthButton mode="login" variant="plain" />
      </div>

      <p className="type-body-sm mt-6 text-center text-grey-600">
        New here?{" "}
        <Link href="/register" className="text-primary-500 underline underline-offset-2 transition hover:text-primary-600">
          Create an Account
        </Link>
      </p>
    </form>
  );
}
