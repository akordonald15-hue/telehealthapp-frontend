import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  return (
    <div className="ct-surface rounded-[24px] p-6 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {Icon ? (
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[#EFF6FF] text-[#2563EB] shadow-[0_10px_22px_-18px_rgba(66,107,179,0.4)]">
              <Icon className="h-6 w-6" />
            </span>
          ) : null}
          <div>
            <h3 className="ct-card-title text-[#1F2937]">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[#667085]">{description}</p>
          </div>
        </div>
        {action ? <div className="sm:pl-4">{action}</div> : null}
      </div>
    </div>
  );
}
