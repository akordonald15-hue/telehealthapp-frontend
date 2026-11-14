import { cn } from "@/lib/utils";

// Figma "DESIGN SYSTEM" → Badge & Chip, Style=Outline, Size=Tiny (24px, 8px radius, 1.5px border),
// with the "Status tags" text style. Text uses the darker step of each colour so it stays readable.
const tones = {
  neutral: "border-grey-300 bg-grey-50 text-grey-700",
  green: "border-success-500 bg-success-50 text-success-700",
  amber: "border-warning-500 bg-warning-50 text-warning-800",
  rose: "border-danger-500 bg-danger-50 text-danger-700",
  cyan: "border-info-500 bg-info-50 text-info-700",
  blue: "border-primary-500 bg-info-100 text-primary-500",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return (
    <span className={cn("type-status-tag inline-flex min-h-6 items-center rounded-[8px] border-[1.5px] px-2 uppercase", tones[tone])}>
      {children}
    </span>
  );
}
