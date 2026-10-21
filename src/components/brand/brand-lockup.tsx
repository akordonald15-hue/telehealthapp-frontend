import Image from "next/image";
import Link from "next/link";

import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandLockupProps = {
  href?: string;
  className?: string;
  textClassName?: string;
  logoClassName?: string;
  wordmarkClassName?: string;
  /** The *SizeClassName / gapClassName props replace their defaults (cn() does not merge conflicting utilities). */
  gapClassName?: string;
  iconSizeClassName?: string;
  wordmarkSizeClassName?: string;
  wordmark?: "text" | "image" | "none";
  inverse?: boolean;
};

export function BrandLockup({
  href,
  className,
  textClassName,
  logoClassName,
  wordmarkClassName,
  gapClassName = "gap-2.5 sm:gap-3",
  iconSizeClassName = "h-10 w-10 sm:h-11 sm:w-11",
  wordmarkSizeClassName = "h-6 max-w-[148px] sm:h-7 sm:max-w-[176px]",
  wordmark = "image",
  inverse = false,
}: BrandLockupProps) {
  const content = (
    <span className={cn("inline-flex items-center", gapClassName, className)}>
      <span className={cn("flex shrink-0 items-center justify-center", logoClassName)}>
        <Image
          src="/Logo/newlogo.png"
          alt={`${BRAND_NAME} logo`}
          width={48}
          height={48}
          priority
          className={cn("object-contain", iconSizeClassName, inverse && "brightness-110 saturate-110")}
        />
      </span>

      {wordmark === "image" ? (
        <Image
          src="/Logo/Name.png"
          alt={BRAND_NAME}
          width={188}
          height={48}
          priority
          className={cn(
            "w-auto object-contain object-left",
            wordmarkSizeClassName,
            inverse && "brightness-0 invert",
            wordmarkClassName,
          )}
        />
      ) : null}

      {wordmark === "text" ? (
        <span
          className={cn(
            "font-heading text-[1.08rem] font-extrabold tracking-[-0.03em] text-[#1F2937]",
            inverse && "text-white",
            textClassName,
          )}
        >
          {BRAND_NAME}
        </span>
      ) : null}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex items-center" aria-label={`${BRAND_NAME} home`}>
      {content}
    </Link>
  );
}
