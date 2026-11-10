import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Figma "DESIGN SYSTEM" → Button. Styles: primary = Filled, secondary = Outline, ghost = Clear.
type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "dark";
// Figma sizes: xs = Tiny (24px), sm = Small (32px), md = Large (48px), lg = Giant (56px).
// `compact` is Figma's Medium (40px).
type ButtonSize = "xs" | "sm" | "compact" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: "min-h-6 rounded-[8px] px-2 text-[10px] leading-3 [&_svg]:size-3",
  sm: "min-h-8 rounded-[8px] px-3 text-xs leading-4 [&_svg]:size-4",
  compact: "min-h-10 rounded-[12px] px-4 text-sm leading-4 [&_svg]:size-4",
  md: "min-h-12 rounded-[12px] px-5 text-base leading-5 [&_svg]:size-5",
  lg: "min-h-14 rounded-[12px] px-6 text-lg leading-6 [&_svg]:size-5",
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 disabled:bg-grey-200 disabled:text-grey-400",
  secondary:
    "border-[1.5px] border-primary-500 bg-white text-primary-500 hover:bg-primary-50 active:bg-primary-200 disabled:border-grey-200 disabled:bg-white disabled:text-grey-400",
  ghost:
    "text-primary-500 hover:bg-primary-50 active:bg-primary-200 disabled:bg-transparent disabled:text-grey-400",
  danger:
    "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 disabled:bg-grey-200 disabled:text-grey-400",
  dark:
    "bg-grey-900 text-white hover:bg-grey-800 active:bg-black-900 disabled:bg-grey-200 disabled:text-grey-400",
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
        "inline-flex items-center justify-center gap-2 font-inter-tight font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed",
        sizeStyles[size],
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}
