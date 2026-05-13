import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, text, icon: Icon }: FeatureCardProps) {
  return (
    <article className="ct-card min-h-[224px] rounded-[26px] p-7">
      <span className="mb-6 grid h-[56px] w-[56px] place-items-center rounded-[20px] bg-[#EFF6FF] text-[#2563EB] shadow-[0_18px_30px_-24px_rgba(37,99,235,0.55)]">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="ct-card-title text-[#1F2937]">{title}</h3>
      <p className="mt-3 text-[0.97rem] leading-7 text-[#667085]">{text}</p>
    </article>
  );
}
