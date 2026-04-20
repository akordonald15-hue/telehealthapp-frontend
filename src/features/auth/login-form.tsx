"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { ApiError } from "@/lib/api/client";
import { useLogin } from "@/lib/auth/use-auth";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";

export function LoginForm() {
  const login = useLogin();
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((values) => login.mutate(values))}>
      {login.error ? (
        <Notice title="Sign in failed">
          {login.error instanceof ApiError ? login.error.message : "Check your email and password."}
        </Notice>
      ) : null}
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...form.register("password")} />
      </Field>
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? "Signing in..." : "Sign in"}
      </Button>
      <div className="flex flex-wrap justify-between gap-3 text-sm text-zinc-600">
        <Link className="font-medium text-[#2563EB]" href="/register">
          Create account
        </Link>
        <Link className="font-medium text-[#2563EB]" href="/password-reset">
          Reset password
        </Link>
      </div>
    </form>
  );
}
