"use client";

import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChoiceProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label?: ReactNode };

const labelStyles =
  "inline-flex cursor-pointer items-center gap-3 font-inter-tight text-base leading-6 text-black-500 has-[:disabled]:cursor-not-allowed has-[:disabled]:text-grey-400";

// Figma "DESIGN SYSTEM" → Checkbox: 24px box, 6px radius, 1.5px border; selected = primary-500.
export function Checkbox({ label, className, ...props }: ChoiceProps) {
  return (
    <label className={cn(labelStyles, className)}>
      <span className="relative inline-flex size-6 shrink-0">
        <input
          type="checkbox"
          className="peer size-6 cursor-pointer appearance-none rounded-[6px] border-[1.5px] border-grey-400 bg-white transition hover:border-primary-500 hover:bg-primary-50 checked:border-primary-500 checked:bg-primary-500 checked:hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed disabled:border-grey-200 disabled:bg-white"
          {...props}
        />
        <Check
          aria-hidden="true"
          strokeWidth={2.5}
          className="pointer-events-none absolute inset-0 m-auto size-4 text-white opacity-0 peer-checked:opacity-100"
        />
      </span>
      {label}
    </label>
  );
}

// Figma "DESIGN SYSTEM" → Radio: 24px circle, 1.5px primary border; selected shows a 12px dot.
// Exported so custom layouts (e.g. selectable cards) can style a bare <input type="radio">.
export const radioInputClassName =
  "size-6 shrink-0 cursor-pointer appearance-none rounded-full border-[1.5px] border-primary-500 bg-white transition hover:border-primary-600 hover:bg-primary-50 checked:bg-primary-500 checked:shadow-[inset_0_0_0_4.5px_white] checked:hover:bg-primary-600 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed disabled:border-grey-200 disabled:bg-white disabled:checked:bg-grey-300";

export function Radio({ label, className, ...props }: ChoiceProps) {
  return (
    <label className={cn(labelStyles, className)}>
      <input type="radio" className={radioInputClassName} {...props} />
      {label}
    </label>
  );
}

// Figma "DESIGN SYSTEM" → Toggle: 44×24 track, 20px white knob; on = primary-500.
export function Toggle({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={cn(labelStyles, className, disabled && "cursor-not-allowed text-grey-400")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed",
          checked ? "bg-primary-500 hover:bg-primary-600 disabled:bg-grey-400" : "bg-primary-50 hover:bg-grey-200 disabled:bg-grey-200",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "absolute left-0.5 size-5 rounded-full bg-white shadow-100 transition-transform",
            checked && "translate-x-5",
          )}
        />
      </button>
      {label}
    </label>
  );
}
