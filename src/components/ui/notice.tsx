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
          ? "rounded-[8px] border border-success-200 bg-success-50 p-4 shadow-300"
          : isWarning
            ? "rounded-[8px] border border-warning-200 bg-warning-50 p-4 shadow-300"
            : "rounded-[8px] border border-primary/15 bg-primary-soft p-4 shadow-300"
      }
    >
      <div className="flex gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-success-700" />
        ) : (
          <AlertCircle className={`mt-0.5 h-5 w-5 ${isWarning ? "text-warning-800" : "text-primary"}`} />
        )}
        <div>
          <p className="font-heading text-sm font-semibold text-grey-800 sm:text-base">{title}</p>
          {children ? <div className="mt-1 text-sm leading-6 text-grey-600">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
