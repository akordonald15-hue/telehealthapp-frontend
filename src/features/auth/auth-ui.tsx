"use client";

import { Check, Eye, EyeOff } from "lucide-react";
import { cloneElement, isValidElement, useId, useState } from "react";
import type { ButtonHTMLAttributes, ComponentProps, ReactElement, ReactNode } from "react";

import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { cn } from "@/lib/utils";

export function AuthCard({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="w-full max-w-[384px] rounded-[20px] bg-grey-200/80 p-1.5">
      <div className="rounded-[14px] bg-white px-5 pb-10 pt-9 shadow-100 sm:px-7">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-grey-200 bg-white text-grey-900 shadow-100">
            {icon}
          </span>
          <h1 className="type-section-heading mt-4 text-grey-900">{title}</h1>
          {subtitle ? <p className="type-body-sm mt-1.5 text-grey-600">{subtitle}</p> : null}
        </div>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

export function AuthField({
  label,
  error,
  hint,
  required,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        "aria-invalid": Boolean(error) || undefined,
        "aria-describedby": errorId ?? hintId,
        required,
      })
    : children;

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="type-input-label text-grey-900">
        {label}
      </label>
      {control}
      {error ? (
        <p id={errorId} className="type-body-sm text-danger-500">
          {error}
        </p>
      ) : null}
      {hintId ? (
        <p id={hintId} className="type-body-sm text-grey-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const inputStyles =
  "h-11 w-full rounded-[10px] border border-grey-200 bg-grey-50 px-4 font-manrope! text-sm! text-grey-900 outline-none transition placeholder:text-grey-400 hover:border-grey-300 focus:border-success-500 focus:bg-success-50 focus:ring-3 focus:ring-success-500/10 aria-[invalid=true]:border-danger-400 aria-[invalid=true]:bg-danger-50 aria-[invalid=true]:focus:border-danger-500 aria-[invalid=true]:focus:ring-danger-500/10 disabled:cursor-not-allowed disabled:opacity-60";

export function AuthInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputStyles, className)} {...props} />;
}

export function AuthPasswordInput({ className, ...props }: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <AuthInput className={cn("pr-11", className)} type={visible ? "text" : "password"} {...props} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-grey-400 transition hover:text-grey-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

type AuthButtonVariant = "primary" | "secondary";

export function authButtonStyles({
  variant = "primary",
  inactive = false,
}: { variant?: AuthButtonVariant; inactive?: boolean } = {}) {
  return cn(
    "type-cta-button! inline-flex h-12 w-full items-center justify-center gap-2 rounded-[10px] px-5 transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200 disabled:cursor-not-allowed",
    variant === "primary" &&
      (inactive ? "bg-grey-200 text-grey-400" : "bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-70"),
    variant === "secondary" && "border border-grey-200 bg-white text-grey-800 hover:bg-grey-50 disabled:opacity-60",
  );
}

export function AuthButton({
  variant,
  inactive,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: AuthButtonVariant; inactive?: boolean }) {
  return <button className={cn(authButtonStyles({ variant, inactive }), className)} {...props} />;
}

export function AuthCheckbox({ label, ...props }: Omit<ComponentProps<"input">, "type"> & { label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2">
      <span className="relative inline-flex">
        <input
          type="checkbox"
          className="peer h-[18px] w-[18px] cursor-pointer appearance-none rounded-[5px] border border-grey-300 bg-white transition checked:border-primary-500 checked:bg-primary-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200"
          {...props}
        />
        <Check
          aria-hidden="true"
          strokeWidth={3}
          className="pointer-events-none absolute inset-0 m-auto h-3 w-3 text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className="type-body-sm text-grey-900">{label}</span>
    </label>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-grey-200" />
      <span className="type-muted-label text-grey-500">{label}</span>
      <span className="h-px flex-1 bg-grey-200" />
    </div>
  );
}

export function AuthAlert({ tone = "danger", children }: { tone?: "danger" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "type-body-sm rounded-[10px] border px-4 py-3",
        tone === "danger" ? "border-danger-100 bg-danger-50 text-danger-700" : "border-success-100 bg-success-50 text-success-700",
      )}
    >
      {children}
    </div>
  );
}

export function AuthErrorAlert({
  error,
  context,
}: {
  error: unknown;
  context: Parameters<typeof getFriendlyErrorMessage>[1];
}) {
  if (!error) {
    return null;
  }

  return (
    <AuthAlert>
      {error instanceof Error ? getFriendlyErrorMessage(error, context) : "Something went wrong. Please try again."}
    </AuthAlert>
  );
}
