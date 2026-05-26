import { cloneElement, isValidElement, useId } from "react";
import type { ReactElement, ReactNode } from "react";

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
    <label className="grid gap-2">
      <span className="text-sm font-bold text-ash-700">
        {label}
        {required ? <span className="ml-1 text-rose-600" aria-hidden="true">*</span> : null}
      </span>
      {control}
      {hint && !error ? <span id={hintId} className="text-xs text-ash-500">{hint}</span> : null}
      {error ? <span id={errorId} className="text-xs font-semibold text-rose-700">{error}</span> : null}
    </label>
  );
}
