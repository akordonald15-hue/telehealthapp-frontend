import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

type StepProgressProps = {
  /** 1-based index of the current step. */
  current: number;
  /** Total number of steps. */
  total: number;
  /** Optional labels per step (length should equal `total`). */
  labels?: string[];
};

/**
 * Reusable multi-step progress indicator. Shows a "N/Total" count, a label for
 * the current step, and a connected dot/segment track marking completed,
 * active, and upcoming steps.
 */
export function StepProgress({ current, total, labels }: StepProgressProps) {
  const steps = Array.from({ length: total }, (_, index) => index + 1);
  const currentLabel = labels?.[current - 1];

  return (
    <div className="grid gap-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
          Step {current} of {total}
        </span>
        <span className="text-xs font-semibold text-ash-500" aria-hidden="true">
          {current}/{total}
        </span>
      </div>

      <div className="flex items-center gap-2" role="list" aria-label={`Step ${current} of ${total}`}>
        {steps.map((step) => {
          const isComplete = step < current;
          const isActive = step === current;
          return (
            <div key={step} className="flex flex-1 items-center gap-2" role="listitem">
              <span
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
                  isComplete && "bg-primary text-white",
                  isActive && "bg-primary text-white ring-4 ring-primary/15",
                  !isComplete && !isActive && "bg-ash-100 text-ash-500",
                )}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? <Check className="h-3.5 w-3.5" /> : step}
              </span>
              {step < total ? (
                <span
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors duration-300",
                    step < current ? "bg-primary" : "bg-ash-100",
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>

      {currentLabel ? (
        <span className="text-sm font-semibold text-ash-700">{currentLabel}</span>
      ) : null}
    </div>
  );
}
