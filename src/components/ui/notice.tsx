import { AlertCircle, CheckCircle2 } from "lucide-react";

export function Notice({
  title,
  children,
  tone = "neutral",
}: {
  title: string;
  children?: React.ReactNode;
  tone?: "neutral" | "success" | "warning";
}) {
  const isSuccess = tone === "success";
  const isWarning = tone === "warning";

  return (
    <div
      className={
        isSuccess
          ? "rounded-[18px] border border-[#BBF7D0] bg-[#F0FDF4] p-4 shadow-[0_10px_30px_rgba(16,185,129,0.08)]"
          : isWarning
            ? "rounded-[18px] border border-[#FDE68A] bg-[#FFFBEB] p-4 shadow-[0_10px_30px_rgba(245,158,11,0.08)]"
            : "rounded-[18px] border border-[#DBEAFE] bg-[#F8FBFF] p-4 shadow-[0_10px_30px_rgba(37,99,235,0.06)]"
      }
    >
      <div className="flex gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
        ) : (
          <AlertCircle className={`mt-0.5 h-5 w-5 ${isWarning ? "text-amber-700" : "text-[#2563EB]"}`} />
        )}
        <div>
          <p className="font-extrabold text-[#1F2937]">{title}</p>
          {children ? <div className="mt-1 text-sm leading-6 text-[#4B5563]">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
