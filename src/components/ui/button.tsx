import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
        variant === "secondary" && "border border-[#E5E7EB] bg-white text-[#1F2937] hover:bg-[#F9FAFB]",
        variant === "danger" && "bg-rose-700 text-white hover:bg-rose-800",
        variant === "ghost" && "text-[#4B5563] hover:bg-[#EFF6FF] hover:text-[#2563EB]",
        className,
      )}
      {...props}
    />
  );
}
