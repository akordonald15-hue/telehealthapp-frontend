import Link from "next/link";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/utils";

type WaveButtonVariant = "solid" | "indigo" | "outline";

const variantStyles: Record<WaveButtonVariant, { className: string; wave: string; waveText: string }> = {
  solid: { className: "bg-[#1E40AF] text-white", wave: "#172554", waveText: "#ffffff" },
  indigo: { className: "bg-[#362FAA] text-white", wave: "#1E1B6B", waveText: "#ffffff" },
  outline: { className: "border border-white text-white", wave: "#ffffff", waveText: "#1E40AF" },
};

type WaveProps = {
  variant?: WaveButtonVariant;
  waveColor?: string;
  waveTextColor?: string;
};

export type WaveButtonProps = WaveProps &
  (({ href: ComponentProps<typeof Link>["href"] } & Omit<ComponentProps<typeof Link>, "href">) | ({ href?: undefined } & ComponentProps<"button">));

export function WaveButton({ variant = "solid", waveColor, waveTextColor, className, style, ...props }: WaveButtonProps) {
  const styles = variantStyles[variant];
  const shared = {
    className: cn(
      "ct-wave-btn inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/25",
      styles.className,
      className,
    ),
    style: { ...style, "--wave": waveColor ?? styles.wave, "--wave-text": waveTextColor ?? styles.waveText } as CSSProperties,
  };

  if (props.href !== undefined) {
    return <Link {...props} {...shared} />;
  }

  return <button type="button" {...props} {...shared} />;
}
