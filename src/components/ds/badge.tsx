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

// Pills as drawn on the Figma app screens ("Confirmed", "Available now", "Received - waiting consultation"):
// 12/16 Inter Tight 500, 8px radius, tinted fill, soft border (bordered={false} for e.g. "Confirmed").
const pillTones = {
  success: "border-success-200 bg-success-50 text-success-500",
  warning: "border-warning-200 bg-warning-50 text-warning-500",
  danger: "border-danger-200 bg-danger-50 text-danger-500",
  info: "border-info-200 bg-info-50 text-info-600",
  primary: "border-grey-200 bg-white text-primary-500",
  neutral: "border-grey-200 bg-grey-50 text-grey-600",
};

export type PillTone = keyof typeof pillTones;

export function Pill({
  children,
  tone = "neutral",
  size = "sm",
  bordered = true,
  className,
}: {
  children: React.ReactNode;
  tone?: PillTone;
  /** sm = 24px, md = 32px */
  size?: "sm" | "md";
  bordered?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-[8px] font-inter-tight text-xs font-medium leading-4",
        bordered ? "border" : "border-0",
        size === "sm" ? "min-h-6 px-2" : "min-h-8 px-3",
        pillTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

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
