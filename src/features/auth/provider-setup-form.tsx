"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { authApi } from "@/lib/api/endpoints";
import type { ProviderSetupVerifyResponse } from "@/lib/types/backend";
import { providerSetupCompleteSchema } from "@/lib/validation/auth";

type ProviderSetupInput = z.infer<typeof providerSetupCompleteSchema>;

const INVALID_LINK_MESSAGE = "This setup link is invalid or expired. Please request a new setup email.";

export function ProviderSetupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const form = useForm<ProviderSetupInput>({
    resolver: zodResolver(providerSetupCompleteSchema),
    defaultValues: { token, new_password: "", confirm_password: "" },
  });

  const verifySetup = useQuery<ProviderSetupVerifyResponse>({
    queryKey: ["provider-setup", token],
    queryFn: () => authApi.providerSetupVerify({ token }),
    enabled: Boolean(token),
    retry: false,
  });

  const completeSetup = useMutation({
    mutationFn: authApi.providerSetupComplete,
    onSuccess: () => {
      window.setTimeout(() => {
        router.push("/login");
      }, 1300);
    },
  });

  if (!token || verifySetup.isError) {
    return (
      <div className="grid gap-5">
        <Notice title={INVALID_LINK_MESSAGE} tone="warning">
          Ask your Caretekk admin to queue a fresh provider setup email.
        </Notice>
        <Button type="button" onClick={() => router.push("/login")}>
          Back to sign in
        </Button>
      </div>
    );
  }

  if (verifySetup.isPending) {
    return (
      <div className="grid gap-5 rounded-[22px] border border-ash-200 bg-ash-50/80 p-5 text-center sm:p-6">
        <div className="mx-auto h-10 w-10 animate-pulse rounded-full border border-primary/30 bg-primary/10" />
        <div>
          <p className="font-heading text-xl font-semibold text-ash-900">Checking your setup link</p>
          <p className="mt-1 text-sm text-ash-600">Securing your provider account setup.</p>
        </div>
      </div>
    );
  }

  if (completeSetup.isSuccess) {
    return (
      <Notice title="Account setup complete" tone="success">
        Redirecting you to sign in now.
      </Notice>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-[22px] border border-ash-200 bg-ash-50/80 px-4 py-3 text-sm text-ash-700">
        <p className="font-medium text-ash-900">Provider account setup</p>
        <p className="mt-1 text-xs text-ash-600">
          {verifySetup.data?.name || "Caretekk provider"} &middot; {verifySetup.data?.role === "nurse" ? "Nurse" : "Doctor"} &middot;{" "}
          {verifySetup.data?.email}
        </p>
      </div>

      <form
        className="grid gap-4 rounded-[22px] border border-ash-200 bg-surface p-5 shadow-[0_16px_40px_-34px_rgba(15,23,42,0.45)] sm:p-6"
        onSubmit={form.handleSubmit((values) => completeSetup.mutate(values))}
      >
        <div>
          <p className="font-heading text-xl font-semibold text-ash-900">Choose your password</p>
          <p className="mt-1 text-sm text-ash-600">This activates your provider account for Caretekk.</p>
        </div>
        <ErrorMessage error={completeSetup.error} context="auth" />
        <input type="hidden" {...form.register("token")} />
        <Field label="New password" error={form.formState.errors.new_password?.message} required>
          <PasswordInput autoComplete="new-password" placeholder="Enter new password" {...form.register("new_password")} />
        </Field>
        <Field label="Confirm password" error={form.formState.errors.confirm_password?.message} required>
          <PasswordInput autoComplete="new-password" placeholder="Confirm new password" {...form.register("confirm_password")} />
        </Field>
        <Button type="submit" disabled={completeSetup.isPending}>
          {completeSetup.isPending ? "Completing setup..." : "Complete account setup"}
        </Button>
      </form>

      <p className="text-center text-sm text-ash-600">
        Already completed setup?{" "}
        <Link className="font-semibold text-primary hover:text-primary-strong" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
