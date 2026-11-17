import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

// Figma "DESIGN SYSTEM" → Button. Styles: primary = Filled, secondary = Outline, ghost = Clear.
// `neutral` (grey outline, e.g. "View details") and `inverse` (white outline on dark surfaces)
// are the variants used on the Figma app screens.
type ButtonVariant = "primary" | "secondary" | "neutral" | "inverse" | "danger" | "ghost" | "dark";
// Figma sizes: xs = Tiny (24px), sm = Small (32px), md = Large (48px), lg = Giant (56px).
// `compact` is Figma's Medium (40px).
type ButtonSize = "xs" | "sm" | "compact" | "md" | "lg";

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & ButtonStyleOptions;

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
  neutral:
    "border-[1.5px] border-grey-200 bg-white text-primary-500 hover:border-grey-400 hover:bg-primary-50 active:bg-primary-200 disabled:text-grey-400",
  inverse:
    "border-[1.5px] border-white text-white hover:bg-white/10 active:bg-white/20 disabled:border-white/40 disabled:text-white/40",
  ghost:
    "text-primary-500 hover:bg-primary-50 active:bg-primary-200 disabled:bg-transparent disabled:text-grey-400",
  danger:
    "bg-danger-500 text-white hover:bg-danger-600 active:bg-danger-700 disabled:bg-grey-200 disabled:text-grey-400",
  dark:
    "bg-grey-900 text-white hover:bg-grey-800 active:bg-black-900 disabled:bg-grey-200 disabled:text-grey-400",
};

/** Button styles for elements that aren't <button>, e.g. `<Link className={buttonClassName({ variant: "neutral" })}>`. */
export function buttonClassName({ variant = "primary", size = "md", className }: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-inter-tight font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus disabled:cursor-not-allowed",
    sizeStyles[size],
    variantStyles[variant],
    className,
  );
}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={buttonClassName({ variant, size, className })} {...props} />;
}
