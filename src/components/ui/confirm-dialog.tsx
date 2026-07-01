"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

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
      <Modal
        open={open}
        title={title}
        description={description}
        onClose={() => setOpen(false)}
        size="sm"
        footer={
          <>
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
          </>
        }
      />
    </>
  );
}
