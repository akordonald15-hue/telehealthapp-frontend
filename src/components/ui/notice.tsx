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
      role={isWarning ? "alert" : "status"}
      className={
        isSuccess
          ? "rounded-[20px] border border-[#BBF7D0] bg-[linear-gradient(180deg,#F4FFF8_0%,#ECFDF3_100%)] p-4 shadow-[0_14px_32px_-24px_rgba(16,185,129,0.18)]"
          : isWarning
            ? "rounded-[20px] border border-[#FDE68A] bg-[linear-gradient(180deg,#FFFDF3_0%,#FFFBEB_100%)] p-4 shadow-[0_14px_32px_-24px_rgba(245,158,11,0.18)]"
            : "rounded-[20px] border border-[#DBEAFE] bg-[linear-gradient(180deg,#FBFDFF_0%,#F4F8FF_100%)] p-4 shadow-[0_14px_32px_-24px_rgba(37,99,235,0.14)]"
      }
    >
      <div className="flex gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
        ) : (
          <AlertCircle className={`mt-0.5 h-5 w-5 ${isWarning ? "text-amber-700" : "text-[#2563EB]"}`} />
        )}
        <div>
          <p className="font-heading text-base font-semibold text-[#1F2937]">{title}</p>
          {children ? <div className="mt-1 text-sm leading-6 text-[#4B5563]">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
