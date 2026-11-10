import { cn } from "@/lib/utils";

// Figma "DESIGN SYSTEM" → Progress Bar: a row of 8px segments (filled = primary-500, empty = grey-200)
// with an optional percentage label (14/20).
export function ProgressBar({
  value,
  segments = 5,
  showLabel = true,
  label,
  className,
}: {
  /** 0–100 */
  value: number;
  segments?: number;
  showLabel?: boolean;
  /** Accessible name, e.g. "Profile completion". */
  label: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  const filled = Math.round((clamped / 100) * segments);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className="flex flex-1 gap-1"
      >
        {Array.from({ length: segments }, (_, index) => (
          <span
            key={index}
            className={cn("h-2 flex-1 rounded-full", index < filled ? "bg-primary-500" : "bg-grey-200")}
          />
        ))}
      </div>
      {showLabel ? <span className="font-inter-tight text-sm leading-5 text-black-500">{clamped}%</span> : null}
    </div>
  );
}
