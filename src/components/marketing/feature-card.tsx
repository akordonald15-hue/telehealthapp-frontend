import type { LucideIcon } from "lucide-react";

type FeatureCardProps = {
  title: string;
  text: string;
  icon: LucideIcon;
};

export function FeatureCard({ title, text, icon: Icon }: FeatureCardProps) {
  return (
    <article className="min-h-[210px] rounded-[22px] border border-[rgba(229,231,234,0.9)] bg-white p-7 shadow-[0_10px_30px_rgba(33,41,54,0.08)] transition duration-200 hover:-translate-y-1.5 hover:border-[rgba(57,97,169,0.22)] hover:shadow-[0_28px_70px_rgba(33,41,54,0.12)]">
      <span className="mb-5 grid h-[52px] w-[52px] place-items-center rounded-[18px] bg-info-50 text-primary-500">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="font-heading text-[1.15rem] font-extrabold tracking-[-0.035em] text-grey-800">{title}</h3>
      <p className="mt-3 text-[0.96rem] text-grey-500">{text}</p>
    </article>
  );
}
