"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ds/button";
import { cn } from "@/lib/utils";

const CODE_LENGTH = 6;

export function SignupOtpStep({
  email,
  serverError,
  isVerifying = false,
  isResending = false,
  resendWait,
  resendSent = false,
  onChangeEmail,
  onResend,
  onVerify,
}: {
  email: string;
  serverError?: string;
  isVerifying?: boolean;
  isResending?: boolean;
  resendWait: number;
  resendSent?: boolean;
  onChangeEmail: () => void;
  onResend: () => void;
  onVerify: (code: string) => void;
}) {
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const errorId = useId();
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const digits = useMemo(
    () => Array.from({ length: CODE_LENGTH }, (_, index) => code[index] ?? ""),
    [code],
  );
  const error = localError || serverError;

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function updateAt(index: number, next: string) {
    const sanitized = next.replace(/\D/g, "");
    if (!sanitized) {
      const cleared = digits.slice();
      cleared[index] = "";
      setCode(cleared.join(""));
      setLocalError("");
      return;
    }

    const updated = digits.slice();
    let cursor = index;
    for (const digit of sanitized) {
      if (cursor >= CODE_LENGTH) {
        break;
      }
      updated[cursor] = digit;
      cursor += 1;
    }

    setCode(updated.join(""));
    setLocalError("");

    const focusTarget = Math.min(cursor, CODE_LENGTH - 1);
    inputsRef.current[focusTarget]?.focus();
    inputsRef.current[focusTarget]?.select();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>, index: number) {
    if (event.key === "Backspace") {
      if (digits[index]) {
        return;
      }
      event.preventDefault();
      if (index > 0) {
        const cleared = digits.slice();
        cleared[index - 1] = "";
        setCode(cleared.join(""));
        inputsRef.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputsRef.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      event.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>, index: number) {
    const text = event.clipboardData.getData("text");
    if (!text) {
      return;
    }
    event.preventDefault();
    updateAt(index, text);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.length !== CODE_LENGTH) {
      setLocalError("Enter the 6-digit code from your email.");
      inputsRef.current[0]?.focus();
      return;
    }
    onVerify(code);
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-1 text-center">
        <p className="type-body-lg text-black-500">
          Enter the 6-digit code we sent to <span className="break-all">{email}</span>.
        </p>
        <p className="type-body-md text-grey-500">The code expires in 10 minutes.</p>
      </div>

      <form className="grid gap-6" noValidate onSubmit={handleSubmit} aria-busy={isVerifying || undefined}>
        <div className="grid gap-2">
          <div role="group" aria-label="Verification code" className="grid grid-cols-6 gap-2">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(node) => {
                  inputsRef.current[index] = node;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                disabled={isVerifying}
                onChange={(event) => updateAt(index, event.target.value)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                onPaste={(event) => handlePaste(event, index)}
                onFocus={(event) => event.target.select()}
                aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
                aria-invalid={Boolean(error) || undefined}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                  "h-14 w-full min-w-0 rounded-[12px] border-[1.5px] border-grey-200 bg-grey-50 text-center font-manrope text-xl text-black-500 outline-none transition placeholder:text-grey-400 focus:border-primary-500 focus:bg-primary-50 focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed disabled:bg-grey-200 disabled:text-grey-400 aria-[invalid=true]:border-danger-500 aria-[invalid=true]:bg-danger-50",
                )}
              />
            ))}
          </div>
          {error ? (
            <p id={errorId} role="alert" className="type-helper-text text-danger-600">
              {error}
            </p>
          ) : null}
        </div>

        <Button type="submit" size="xl" className="w-full" disabled={isVerifying}>
          {isVerifying ? "Confirming..." : "Confirm email"}
        </Button>

        <div className="grid justify-items-center gap-2 text-center">
          <p className="type-body-md text-grey-500">Didn&apos;t get it?</p>
          <Button
            type="button"
            variant="ghost"
            size="compact"
            disabled={isResending || resendWait > 0}
            onClick={onResend}
          >
            {isResending ? "Sending..." : resendWait > 0 ? `Resend code in ${resendWait}s` : "Resend code"}
          </Button>
          {resendSent ? (
            <p className="type-helper-text text-success-700" role="status">
              A fresh code has been sent.
            </p>
          ) : null}
          <Button type="button" variant="ghost" size="compact" onClick={onChangeEmail}>
            Use a different email
          </Button>
        </div>
      </form>
    </div>
  );
}
