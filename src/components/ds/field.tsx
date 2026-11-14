import { cloneElement, isValidElement, useId } from "react";
import type { ReactElement, ReactNode } from "react";

// Figma "DESIGN SYSTEM" → Input: label (Inter Tight 16/20, 500), 8px gap, helper / error text (Manrope 14/20).
export function Field({
  label,
  error,
  children,
  hint,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const generatedId = useId();
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-invalid": Boolean(error) || undefined,
        "aria-describedby": describedBy,
        required,
      })
    : children;

  return (
    <label className="grid content-start gap-2">
      <span className="font-inter-tight text-base font-medium leading-5 text-black-500">
        {label}
        {required ? <span className="ml-1 text-danger-500" aria-hidden="true">*</span> : null}
      </span>
      {control}
      {hint && !error ? <span id={hintId} className="type-helper-text text-grey-500">{hint}</span> : null}
      {error ? <span id={errorId} className="type-helper-text text-danger-600">{error}</span> : null}
    </label>
  );
}
