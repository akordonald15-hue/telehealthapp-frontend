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

  return (
    <div className="rounded-md border border-zinc-200 bg-white p-4">
      <div className="flex gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-700" />
        ) : (
          <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
        )}
        <div>
          <p className="font-semibold text-zinc-950">{title}</p>
          {children ? <div className="mt-1 text-sm leading-6 text-zinc-600">{children}</div> : null}
        </div>
      </div>
    </div>
  );
}
