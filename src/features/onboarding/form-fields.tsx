"use client";

import { Controller, useFormContext } from "react-hook-form";
import type { FieldPath, FieldValues } from "react-hook-form";

import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { OnboardingValues } from "./onboarding-schema";

type Name = FieldPath<OnboardingValues>;

function errorFor(errors: FieldValues, name: string) {
  return errors[name]?.message as string | undefined;
}

export function TextField({
  name,
  label,
  hint,
  required,
  readOnly,
  value,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  name: Name;
  label: string;
  hint?: string;
  required?: boolean;
  readOnly?: boolean;
  value?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<OnboardingValues>();

  return (
    <Field label={label} hint={hint} required={required} error={errorFor(errors, name)}>
      <Input
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        readOnly={readOnly}
        className={cn(readOnly && "cursor-not-allowed border-ash-200 bg-white text-ash-800")}
        value={value}
        {...register(name)}
      />
    </Field>
  );
}

export function SelectField({
  name,
  label,
  options,
  placeholder = "Select an option",
  required,
  disabled,
}: {
  name: Name;
  label: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<OnboardingValues>();

  return (
    <Field label={label} required={required} error={errorFor(errors, name)}>
      <Select disabled={disabled} {...register(name)}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/**
 * Tappable option cards — a mobile-first alternative to a native select for
 * short option sets (age range, gender). Renders as a wrapping grid of pills.
 */
export function OptionCardGroup({
  name,
  label,
  options,
  required,
}: {
  name: Name;
  label: string;
  options: { value: string; label: string }[];
  required?: boolean;
}) {
  const {
    control,
    formState: { errors },
  } = useFormContext<OnboardingValues>();

  return (
    <Field label={label} required={required} error={errorFor(errors, name)}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={label}>
            {options.map((option) => {
              const selected = field.value === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => field.onChange(option.value)}
                  className={cn(
                    "min-h-12 rounded-[14px] border px-4 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15",
                    selected
                      ? "border-primary bg-primary-soft text-primary shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                      : "border-ash-200 bg-surface text-ash-700 hover:border-primary hover:text-primary",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      />
    </Field>
  );
}
