"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { PasswordInput } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { useChangePassword, useCurrentUser } from "@/lib/auth/use-auth";
import { hasStoredSession } from "@/lib/auth/tokens";
import { changePasswordSchema, type ChangePasswordInput } from "@/lib/validation/auth";
import { useRouter } from "next/navigation";

export function ChangePasswordForm() {
  const router = useRouter();
  const userQuery = useCurrentUser();
  const changePassword = useChangePassword();
  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  useEffect(() => {
    if (!hasStoredSession()) {
      router.replace("/login");
      return;
    }
    if (userQuery.data && !userQuery.data.must_change_password) {
      router.replace("/dashboard");
    }
  }, [router, userQuery.data]);

  return (
    <form
      className="grid gap-5"
      onSubmit={form.handleSubmit(({ old_password, new_password }) =>
        changePassword.mutate({ old_password, new_password }),
      )}
    >
      <Notice title="Change temporary password" tone="warning">
        Doctors and nurses must set a personal password before entering the Caretekk workspace.
      </Notice>
      {changePassword.error ? <ErrorMessage error={changePassword.error} context="auth" /> : null}
      <Field label="Current password" error={form.formState.errors.old_password?.message} required>
        <PasswordInput autoComplete="current-password" placeholder="Enter temporary password" {...form.register("old_password")} />
      </Field>
      <Field label="New password" error={form.formState.errors.new_password?.message} required>
        <PasswordInput autoComplete="new-password" placeholder="Create a new password" {...form.register("new_password")} />
      </Field>
      <Field label="Confirm new password" error={form.formState.errors.confirm_password?.message} required>
        <PasswordInput autoComplete="new-password" placeholder="Repeat new password" {...form.register("confirm_password")} />
      </Field>
      <Button type="submit" disabled={changePassword.isPending || userQuery.isLoading}>
        {changePassword.isPending ? "Updating password..." : "Continue"}
      </Button>
      <p className="text-xs text-ash-500">
        Staff accounts receive login details from Caretekk admin. If your temporary password no longer works, contact support.
      </p>
      {!hasStoredSession() ? (
        <p className="text-sm text-ash-600">
          <Link className="font-semibold text-primary hover:text-primary-strong" href="/login">
            Return to sign in
          </Link>
        </p>
      ) : null}
    </form>
  );
}
