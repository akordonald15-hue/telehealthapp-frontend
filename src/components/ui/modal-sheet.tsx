"use client";

import { X } from "lucide-react";
import { useEffect, useId } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ModalSheetProps = {
  open: boolean;
  title?: string;
  description?: string;
  onClose?: () => void;
  /** When false the backdrop click + close button + Escape are disabled (e.g. required flows). */
  dismissible?: boolean;
  /** Optional node rendered above the title (e.g. a progress indicator). */
  header?: ReactNode;
  /** Optional sticky footer (e.g. Back / Continue actions). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Reusable overlay that renders as a bottom-sheet on mobile and a centered
 * modal card from `sm:` upward. Handles Escape-to-close, backdrop dismissal,
 * and body scroll lock. Animations live in globals.css and respect
 * prefers-reduced-motion.
 */
export function ModalSheet({
  open,
  title,
  description,
  onClose,
  dismissible = true,
  header,
  footer,
  children,
  className,
}: ModalSheetProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) onClose?.();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className="onboarding-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-ash-900/45 backdrop-blur-sm sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descriptionId : undefined}
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className={cn(
          "onboarding-sheet ct-safe-area relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface shadow-2xl",
          "rounded-t-[28px] sm:max-w-md sm:rounded-[28px]",
          "border border-white/70",
          className,
        )}
      >
        {dismissible && onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-ash-500 transition hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}

        <div className="flex-1 overflow-y-auto px-5 pb-6 pt-6 sm:px-7">
          {/* Mobile grab handle */}
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-ash-200 sm:hidden" aria-hidden="true" />
          {header ? <div className="mb-5">{header}</div> : null}
          {title ? (
            <h2 id={titleId} className="font-heading text-xl font-semibold tracking-[-0.01em] text-ash-800">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p id={descriptionId} className="mt-1.5 text-sm leading-6 text-ash-600">
              {description}
            </p>
          ) : null}
          <div className={cn(title || description ? "mt-5" : "")}>{children}</div>
        </div>

        {footer ? (
          <div className="border-t border-ash-100 bg-surface px-5 py-4 sm:px-7">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
