"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
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
      <Notice title="Welcome back" tone="neutral">
        Sign in to continue to your secure Caretekk workspace. Patients, doctors, nurses, and admins can use their provided credentials.
      </Notice>
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
      <Field label="Email" error={form.formState.errors.email?.message} hint="Use the email tied to your Caretekk account.">
        <Input type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message}>
        <Input type="password" autoComplete="current-password" placeholder="Enter your password" {...form.register("password")} />
      </Field>
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? "Signing in..." : "Sign in"}
      </Button>
      <div className="flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>
          New here?{" "}
          <Link className="font-semibold text-[#2563EB]" href="/register">
            Create patient account
          </Link>
        </p>
        <Link className="font-semibold text-[#2563EB]" href="/password-reset">
          Reset password
        </Link>
      </div>
    </form>
  );
}
