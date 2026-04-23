import type { ReactNode } from "react";

export function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-[#334155]">{label}</span>
      {children}
      {hint && !error ? <span className="text-xs text-[#64748B]">{hint}</span> : null}
      {error ? <span className="text-xs font-semibold text-rose-700">{error}</span> : null}
    </label>
  );
}
