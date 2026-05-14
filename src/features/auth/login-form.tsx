"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, PasswordInput } from "@/components/ui/input";
import { GoogleAuthButton } from "@/features/auth/google-auth-button";
import { useLogin } from "@/lib/auth/use-auth";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export function LoginForm() {
  const login = useLogin();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

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

  return (
    <form className="grid gap-5" onSubmit={form.handleSubmit((values) => login.mutate(values))}>
      <GoogleAuthButton mode="login" />
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>Or continue with email</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      {login.error ? (
        <div className="grid gap-3">
          <ErrorMessage error={login.error} context="auth" />
          {login.error instanceof Error && login.error.message.toLowerCase().includes("email not verified") ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-4 text-sm font-extrabold text-[#2563EB]"
              href="/verify-email"
            >
              Confirm email
            </Link>
          ) : null}
        </div>
      ) : null}
      <Field label="Email" error={form.formState.errors.email?.message} required>
        <Input type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message} required>
        <PasswordInput autoComplete="current-password" placeholder="Enter your password" {...form.register("password")} />
      </Field>
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? "Signing in..." : "Sign in"}
      </Button>
      <div className="flex flex-col items-center gap-2 text-sm text-slate-600 sm:flex-row sm:justify-between">
        <p>
          New here?{" "}
          <Link className="font-semibold text-[#2563EB]" href="/register">
            Create account
          </Link>
        </p>
        <Link className="font-semibold text-[#2563EB]" href="/password-reset">
          Forgot password
        </Link>
      </div>
    </form>
  );
}
