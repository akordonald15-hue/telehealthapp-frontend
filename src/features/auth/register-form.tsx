"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { authApi } from "@/lib/api/endpoints";
import { registerSchema, type RegisterInput } from "@/lib/validation/auth";

export function RegisterForm() {
  const register = useMutation({ mutationFn: authApi.register });
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      phone: "",
      role: "patient",
      password: "",
    },
  });

  if (register.isSuccess) {
    return (
      <div className="grid gap-4">
        <Notice title="Account created" tone="success">
          Verify your email before signing in. The backend creates a verification token but does not return it in the
          registration response.
        </Notice>
        <Link className="text-sm font-semibold text-emerald-800" href="/verify-email">
          Enter verification token
        </Link>
      </div>
    );
  }

  return (
    <form className="grid gap-4" onSubmit={form.handleSubmit((values) => register.mutate(values))}>
      {register.error ? <Notice title="Registration failed">{register.error.message}</Notice> : null}
      <Field label="Email" error={form.formState.errors.email?.message}>
        <Input type="email" autoComplete="email" {...form.register("email")} />
      </Field>
      <Field label="Phone" error={form.formState.errors.phone?.message}>
        <Input type="tel" autoComplete="tel" {...form.register("phone")} />
      </Field>
      <Field label="Role" error={form.formState.errors.role?.message}>
        <Select {...form.register("role")}>
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </Select>
      </Field>
      <Field label="Password" error={form.formState.errors.password?.message} hint="Minimum 8 characters">
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      <Button type="submit" disabled={register.isPending}>
        {register.isPending ? "Creating account..." : "Create account"}
      </Button>
      <Link className="text-sm font-medium text-emerald-800" href="/login">
        Sign in instead
      </Link>
    </form>
  );
}
