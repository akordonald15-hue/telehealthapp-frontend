"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";

type ConfirmTone = "neutral" | "danger" | "primary";

type ConfirmDialogProps = {
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
  tone?: ConfirmTone;
  onConfirm: () => void;
  triggerClassName?: string;
};

export function ConfirmDialog({
  label,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  disabled,
  tone = "neutral",
  onConfirm,
  triggerClassName,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const triggerVariant = tone === "danger" ? "danger" : tone === "primary" ? "primary" : "secondary";
  const confirmVariant = tone === "danger" ? "danger" : "primary";

  return (
    <>
      <Button
        type="button"
        variant={triggerVariant}
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={triggerClassName}
      >
        {label}
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-[70] grid place-items-center bg-ash-900/40 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-[8px] border border-white/70 bg-surface p-5 shadow-2xl">
            <h3 id={titleId} className="font-heading text-xl font-semibold text-ash-800">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-ash-600">{description}</p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant={confirmVariant}
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
              >
                {confirmLabel ?? label}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
