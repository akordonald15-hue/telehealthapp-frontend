import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-zinc-100 text-zinc-800",
  green: "bg-emerald-100 text-emerald-900",
  amber: "bg-amber-100 text-amber-900",
  rose: "bg-rose-100 text-rose-900",
  cyan: "bg-cyan-100 text-cyan-900",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
}) {
  return <span className={cn("inline-flex rounded px-2 py-1 text-xs font-semibold", tones[tone])}>{children}</span>;
}
