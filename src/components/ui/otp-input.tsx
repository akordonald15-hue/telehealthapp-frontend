"use client";

import { useEffect, useId, useMemo, useRef } from "react";

import { cn } from "@/lib/utils";

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaInvalid?: boolean;
  autoFocus?: boolean;
  name?: string;
};

export function OtpInput({
  length = 6,
  value,
  onChange,
  disabled,
  ariaLabel = "One-time code",
  ariaInvalid,
  autoFocus = true,
  name,
}: OtpInputProps) {
  const groupId = useId();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const digits = useMemo(() => {
    const sanitized = value.replace(/\D/g, "").slice(0, length);
    return Array.from({ length }, (_, index) => sanitized[index] ?? "");
  }, [length, value]);

  useEffect(() => {
    if (autoFocus && !disabled) {
      inputsRef.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  function updateAt(index: number, next: string) {
    const sanitized = next.replace(/\D/g, "");
    if (!sanitized) {
      const cleared = digits.slice();
      cleared[index] = "";
      onChange(cleared.join(""));
      return;
    }
    const updated = digits.slice();
    let cursor = index;
    for (const digit of sanitized) {
      if (cursor >= length) break;
      updated[cursor] = digit;
      cursor += 1;
    }
    onChange(updated.join(""));
    const focusTarget = Math.min(cursor, length - 1);
    inputsRef.current[focusTarget]?.focus();
    inputsRef.current[focusTarget]?.select();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace") {
      if (digits[index]) return;
      event.preventDefault();
      if (index > 0) {
        const cleared = digits.slice();
        cleared[index - 1] = "";
        onChange(cleared.join(""));
        inputsRef.current[index - 1]?.focus();
      }
      return;
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
      return;
    }
    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>, index: number) {
    const text = event.clipboardData.getData("text");
    if (!text) return;
    event.preventDefault();
    updateAt(index, text);
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex items-center justify-between gap-2 sm:gap-3"
    >
      {digits.map((digit, index) => (
        <input
          key={`${groupId}-${index}`}
          ref={(node) => {
            inputsRef.current[index] = node;
          }}
          name={name && index === 0 ? name : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => updateAt(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(event, index)}
          onPaste={(event) => handlePaste(event, index)}
          onFocus={(event) => event.target.select()}
          aria-label={`Digit ${index + 1} of ${length}`}
          aria-invalid={ariaInvalid || undefined}
          className={cn(
            "h-14 w-12 rounded-[14px] border border-ash-200 bg-surface text-center font-heading text-2xl font-semibold text-ash-900 shadow-[0_8px_24px_rgba(31,41,55,0.035)] outline-none transition placeholder:text-ash-400 focus:border-primary focus:ring-4 focus:ring-primary/15 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50 sm:h-16 sm:w-14",
            ariaInvalid && "border-rose-300 focus:ring-rose-100",
          )}
        />
      ))}
    </div>
  );
}
