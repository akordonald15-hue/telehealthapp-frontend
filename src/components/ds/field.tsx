import { cloneElement, isValidElement, useId } from "react";
import type { ReactElement, ReactNode } from "react";

// Figma "DESIGN SYSTEM" → Input: label (Inter Tight 16/20, 500), 8px gap, helper / error / success text (Manrope 14/20).
// `success` switches the control to its Valid state and shows the message; error takes precedence over both.
// `labelAs="div"` uses a <div> + aria-labelledby instead of a wrapping <label>; use it for
// custom controls such as SelectMenu, where a wrapping label would merge the value into the name
// and re-activate the trigger when an option is clicked.
export function Field({
  label,
  error,
  children,
  hint,
  success,
  required,
  labelAs = "label",
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
  success?: string;
  required?: boolean;
  labelAs?: "label" | "div";
}) {
  const generatedId = useId();
  const labelId = `${generatedId}-label`;
  const hintId = hint ? `${generatedId}-hint` : undefined;
  const errorId = error ? `${generatedId}-error` : undefined;
  const successId = success && !error ? `${generatedId}-success` : undefined;
  const describedBy = [errorId, successId, hintId].filter(Boolean).join(" ") || undefined;
  // Only forward `required` when explicitly set so a custom control can supply
  // its own required/aria-required state without Field wiping it out.
  const controlProps: Record<string, unknown> = {
    "aria-invalid": Boolean(error) || undefined,
    "aria-describedby": describedBy,
    "aria-labelledby": labelAs === "div" ? labelId : undefined,
    tone: success && !error ? "success" : undefined,
  };
  if (required !== undefined) {
    controlProps.required = required;
  }
  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, controlProps)
    : children;

  const labelNode = (
    <span
      id={labelAs === "div" ? labelId : undefined}
      className="font-inter-tight text-base font-medium leading-5 text-black-500"
    >
      {label}
      {required ? <span className="ml-1 text-danger-500" aria-hidden="true">*</span> : null}
    </span>
  );

  const messages = error ? (
    <span id={errorId} role="alert" className="type-helper-text text-danger-600">{error}</span>
  ) : success ? (
    <span id={successId} className="type-helper-text text-success-700">{success}</span>
  ) : hint ? (
    <span id={hintId} className="type-helper-text text-grey-500">{hint}</span>
  ) : null;

  if (labelAs === "div") {
    return (
      <div className="grid content-start gap-2">
        {labelNode}
        {control}
        {messages}
      </div>
    );
  }

  return (
    <label className="grid content-start gap-2">
      {labelNode}
      {control}
      {messages}
    </label>
  );
}
