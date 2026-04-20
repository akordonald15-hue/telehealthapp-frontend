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
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      {children}
      {hint && !error ? <span className="text-xs text-zinc-500">{hint}</span> : null}
      {error ? <span className="text-xs font-medium text-rose-700">{error}</span> : null}
    </label>
  );
}
