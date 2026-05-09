import Image from "next/image";

import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";

type ProviderPickerCardProps = {
  name: string;
  subtitle: string;
  imageUrl?: string | null;
  status: string;
  selected?: boolean;
  disabled?: boolean;
  primaryDetail?: string;
  secondaryDetail?: string;
  actionLabel: string;
  disabledLabel?: string;
  onSelect: () => void;
};

export function ProviderPickerCard({
  name,
  subtitle,
  imageUrl,
  status,
  selected,
  disabled,
  primaryDetail,
  secondaryDetail,
  actionLabel,
  disabledLabel = "Unavailable",
  onSelect,
}: ProviderPickerCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "group grid w-full gap-3 rounded-[20px] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15",
        selected
          ? "border-[#2563EB] bg-[#EFF6FF] shadow-[0_18px_44px_-34px_rgba(37,99,235,0.5)]"
          : "border-slate-200 bg-slate-50 hover:border-blue-100 hover:bg-white",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[16px] bg-white text-sm font-extrabold text-[var(--primary)] shadow-sm">
          {imageUrl ? (
            <Image src={imageUrl} alt="" width={48} height={48} className="h-full w-full object-cover" unoptimized />
          ) : (
            name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#1F2937]">{name}</p>
              <p className="mt-1 line-clamp-1 text-sm text-slate-600">{subtitle}</p>
            </div>
            <StatusBadge value={status} />
          </div>
        </div>
      </div>

      {(primaryDetail || secondaryDetail) ? (
        <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          {primaryDetail ? <span>{primaryDetail}</span> : null}
          {secondaryDetail ? <span>{secondaryDetail}</span> : null}
        </div>
      ) : null}

      <span
        className={cn(
          "inline-flex min-h-10 w-full items-center justify-center rounded-[12px] px-3 text-sm font-extrabold sm:w-fit",
          disabled ? "bg-slate-200 text-slate-500" : "bg-[#2563EB] text-white",
        )}
      >
        {disabled ? disabledLabel : actionLabel}
      </span>
    </button>
  );
}
