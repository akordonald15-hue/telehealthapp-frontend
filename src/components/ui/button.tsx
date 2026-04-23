import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-[12px] px-4 text-sm font-extrabold tracking-[-0.01em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-[linear-gradient(135deg,#2563EB,#60A5FA)] text-white shadow-[0_16px_32px_rgba(37,99,235,0.22)] hover:-translate-y-0.5 hover:shadow-[0_20px_42px_rgba(37,99,235,0.3)]",
        variant === "secondary" &&
          "border border-[#E5E7EB] bg-white text-[#1F2937] shadow-[0_8px_24px_rgba(31,41,55,0.05)] hover:-translate-y-0.5 hover:border-[#BFDBFE] hover:bg-[#F8FBFF]",
        variant === "danger" && "bg-rose-700 text-white hover:-translate-y-0.5 hover:bg-rose-800",
        variant === "ghost" && "text-[#4B5563] hover:bg-[#EFF6FF] hover:text-[#2563EB]",
        className,
      )}
      {...props}
    />
  );
}
