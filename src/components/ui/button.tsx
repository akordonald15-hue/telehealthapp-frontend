import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-[10px] px-3 text-sm",
  md: "min-h-11 rounded-[12px] px-4 text-[15px]",
  lg: "min-h-13 rounded-[14px] px-6 text-base",
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_20px_-10px_rgba(37,99,235,0.45)] hover:bg-primary-strong hover:shadow-[0_2px_4px_rgba(15,23,42,0.1),0_12px_28px_-10px_rgba(37,99,235,0.55)]",
  secondary:
    "border border-ash-300 bg-surface text-ash-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-primary hover:bg-primary-tint hover:text-primary",
  dark:
    "bg-ash-900 text-white hover:bg-primary-deep",
  danger:
    "bg-danger text-white hover:opacity-95",
  ghost:
    "text-ash-700 hover:bg-primary-tint hover:text-primary",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50",
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
