import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[12px] px-4 text-sm font-extrabold transition duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,var(--primary-strong),var(--primary),var(--accent))] text-white shadow-[0_16px_32px_rgba(66,107,179,0.22)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(66,107,179,0.3)]",
        variant === "secondary" &&
          "border border-[var(--border)] bg-white text-[#1F2937] shadow-[0_8px_24px_rgba(31,41,55,0.05)] hover:-translate-y-0.5 hover:border-[rgba(112,152,212,0.65)] hover:bg-[var(--primary-soft)]",
        variant === "danger" && "bg-rose-700 text-white hover:-translate-y-0.5 hover:bg-rose-800",
        variant === "ghost" && "text-[#4B5563] hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]",
        className,
      )}
      {...props}
    />
  );
}
