import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-[#F3F4F6] text-[#374151]",
  green: "bg-[#ECFDF5] text-[#047857]",
  amber: "bg-[#FFFBEB] text-[#B45309]",
  rose: "bg-[#FEF2F2] text-[#BE123C]",
  cyan: "bg-[#ECFEFF] text-[#0F766E]",
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
