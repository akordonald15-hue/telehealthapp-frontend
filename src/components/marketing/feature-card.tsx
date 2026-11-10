import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, text, icon: Icon }: FeatureCardProps) {
  return (
    <article className="min-h-[210px] rounded-[22px] border border-[rgba(229,231,235,0.9)] bg-white p-7 shadow-[0_10px_30px_rgba(31,41,55,0.08)] transition duration-200 hover:-translate-y-1.5 hover:border-[rgba(37,99,235,0.22)] hover:shadow-[0_28px_70px_rgba(31,41,55,0.12)]">
      <span className="mb-5 grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-[#EFF6FF] text-[#2563EB]">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="font-heading text-[1.15rem] font-extrabold tracking-[-0.035em] text-[#1F2937]">{title}</h3>
      <p className="mt-3 text-[0.96rem] text-[#667085]">{text}</p>
    </article>
  );
}
