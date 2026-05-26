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
          ? "rounded-[20px] border border-emerald-200 bg-success-soft p-4 shadow-[0_14px_32px_-24px_rgba(16,185,129,0.18)]"
          : isWarning
            ? "rounded-[20px] border border-amber-200 bg-warning-soft p-4 shadow-[0_14px_32px_-24px_rgba(245,158,11,0.18)]"
            : "rounded-[20px] border border-primary/15 bg-primary-soft p-4 shadow-[0_14px_32px_-24px_rgba(66,107,179,0.14)]"
      }
    >
      <div className="flex gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
        ) : (
          <AlertCircle className={`mt-0.5 h-5 w-5 ${isWarning ? "text-warning" : "text-primary"}`} />
        )}
        <div>
          <p className="font-heading text-base font-semibold text-ash-800">{title}</p>
          {children ? <div className="mt-1 text-sm leading-6 text-ash-600">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
