import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-ash-100 text-ash-700",
  green: "bg-success-soft text-success",
  amber: "bg-warning-soft text-warning",
  rose: "bg-danger-soft text-danger",
  cyan: "bg-cyan-50 text-cyan-700",
  blue: "bg-primary-soft text-primary-strong",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em]", tones[tone])}>{children}</span>;
}
