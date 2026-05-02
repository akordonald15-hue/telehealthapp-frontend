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
  wordmark?: "text" | "image" | "none";
  inverse?: boolean;
};

export function BrandLockup({
  href,
  className,
  textClassName,
  logoClassName,
  wordmarkClassName,
  wordmark = "image",
  inverse = false,
}: BrandLockupProps) {
  const content = (
    <span className={cn("inline-flex items-center gap-2.5 sm:gap-3", className)}>
      <span className={cn("flex shrink-0 items-center justify-center", logoClassName)}>
        <Image
          src="/Logo/Logo.png"
          alt={`${BRAND_NAME} logo`}
          width={48}
          height={48}
          priority
          className={cn("h-10 w-10 object-contain sm:h-11 sm:w-11", inverse && "brightness-110 saturate-110")}
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
            "h-6 w-auto max-w-[148px] object-contain object-left sm:h-7 sm:max-w-[176px]",
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
