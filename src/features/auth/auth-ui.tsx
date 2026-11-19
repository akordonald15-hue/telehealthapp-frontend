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
  align = "center",
  children,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  align?: "center" | "start";
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "w-full max-w-[450px] rounded-2xl border-[10px] border-grey-200 bg-white px-5 pt-10 sm:px-7.5",
        align === "center" ? "pb-[74px]" : "pb-[99px]",
      )}
    >
      {align === "center" ? (
        <div className="mx-auto flex max-w-[286px] flex-col items-center gap-6 text-center">
          {icon ? (
            <span className="flex h-15 w-15 items-center justify-center rounded-full border-4 border-[#DFE1E3] bg-white text-[#292D32]">
              {icon}
            </span>
          ) : null}
          <div className="grid gap-1">
            <h1 className="type-page-title text-black-500">{title}</h1>
            {subtitle ? <p className="type-body-lg text-grey-500">{subtitle}</p> : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-1">
          <h1 className="type-page-title text-primary-500">{title}</h1>
          {subtitle ? <p className="type-body-lg text-grey-500">{subtitle}</p> : null}
        </div>
      )}
      <div className="mt-6">{children}</div>
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
      <label htmlFor={id} className="type-body-lg text-black-500">
        {label}
      </label>
      {control}
      {error ? (
        <p id={errorId} className="type-helper-text text-danger-500">
          {error}
        </p>
      ) : null}
      {hintId ? (
        <p id={hintId} className="type-helper-text text-grey-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const inputStyles =
  "h-14 w-full rounded-2xl bg-grey-50 px-4.5 type-input-text! text-black-500 shadow-[inset_0_0_0_1.5px_var(--field-border)] outline-none transition-[background-color,box-shadow] [--field-border:var(--color-grey-200)] placeholder:text-grey-400 hover:bg-primary-50 hover:[--field-border:var(--color-grey-400)] focus:bg-primary-50 focus:[--field-border:var(--color-primary-500)] aria-[invalid=true]:bg-danger-50 aria-[invalid=true]:[--field-border:var(--color-danger-500)] disabled:cursor-not-allowed disabled:bg-grey-200 disabled:[--field-border:var(--color-grey-300)]";

export function AuthInput({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputStyles, className)} {...props} />;
}

export function AuthPasswordInput({ className, ...props }: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <AuthInput className={cn("pr-[50px]", className)} type={visible ? "text" : "password"} {...props} />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute right-2.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-grey-400 transition hover:text-grey-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
    "inline-flex h-[65px] w-full items-center justify-center gap-2.5 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200 disabled:cursor-not-allowed",
    variant === "primary" && "type-body-giant! rounded-2xl px-4.5",
    variant === "primary" &&
      (inactive ? "bg-grey-200 text-grey-400" : "bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-70"),
    variant === "secondary" &&
      "type-body-lg! rounded-[18px] bg-white px-6 text-[#1A1C1E] shadow-[inset_0_0_0_1px_#EFF0F6,inset_0_-3px_6px_rgb(244_245_250/0.6)] hover:bg-grey-50 disabled:opacity-60",
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
    <label className="inline-flex cursor-pointer items-center gap-4">
      <span className="relative inline-flex">
        <input
          type="checkbox"
          className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-[1.5px] border-grey-300 bg-white transition-colors checked:border-primary-500 checked:bg-primary-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary-200"
          {...props}
        />
        <Check
          aria-hidden="true"
          absoluteStrokeWidth
          strokeWidth={1.5}
          className="pointer-events-none absolute inset-0 m-auto h-4 w-4 text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      <span className="type-body-md text-black-500">{label}</span>
    </label>
  );
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-[#E9ECEF]" />
      <span className="type-body-md text-[#6B6B80]">{label}</span>
      <span className="h-px flex-1 bg-[#E9ECEF]" />
    </div>
  );
}

export function AuthAlert({ tone = "danger", children }: { tone?: "danger" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "type-helper-text rounded-2xl px-4.5 py-3.5",
        tone === "danger" ? "bg-danger-50 text-danger-500" : "bg-success-50 text-success-700",
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
