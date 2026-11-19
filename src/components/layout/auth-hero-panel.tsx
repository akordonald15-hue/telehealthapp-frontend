"use client";

import Image from "next/image";
import { useState } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const SLIDES = ["/img/Dr michael Idam.jpg", "/img/Dr effiong Okon.jpg", "/img/Dr Paul Chinonso.jpg"];
const SLIDE_DURATION_MS = 6000;

export function AuthHeroPanel() {
  const [active, setActive] = useState(0);

  return (
    <aside className="group/hero relative hidden overflow-hidden rounded-lg bg-black-800 lg:sticky lg:top-2.5 lg:flex lg:h-[calc(100dvh-1.25rem)] lg:min-h-[560px] lg:flex-col lg:justify-between lg:self-start lg:p-12 xl:px-[72px] xl:pb-14 xl:pt-[52px]">
      {SLIDES.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="50vw"
          className={cn(
            "object-cover object-[50%_20%] [transition:opacity_1.2s_ease-in-out,scale_7s_ease-out] motion-reduce:scale-100 motion-reduce:[transition:opacity_1.2s_ease-in-out]",
            index === active ? "scale-100 opacity-100" : "scale-[1.08] opacity-0",
          )}
        />
      ))}
      <div aria-hidden="true" className="absolute inset-0 bg-black-900/40" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black-900/85 to-transparent" />

      <div className="relative z-10">
        <BrandLockup
          href="/"
          gapClassName="gap-2"
          iconSizeClassName="h-8 w-8 brightness-0 invert"
          wordmarkSizeClassName="h-6 max-w-[148px]"
          wordmarkClassName="brightness-0 invert"
        />
      </div>

      <div className="relative z-10 max-w-[480px] text-white">
        <p className="type-heading-4">A Better place to get care that puts your family first</p>
        <p className="type-body-md mt-4 text-white/80">With {BRAND_NAME} you can find care solutions</p>
        <div aria-hidden="true" className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1.5">
          {SLIDES.map((src, index) => (
            <button
              key={src}
              type="button"
              tabIndex={-1}
              onClick={() => setActive(index)}
              className={cn(
                "relative h-1.5 cursor-pointer overflow-hidden rounded-full bg-grey-300 transition-[width,background-color] duration-500 ease-out",
                index === active ? "w-5" : "w-1.5 hover:bg-grey-400",
              )}
            >
              {index === active ? (
                <span
                  onAnimationEnd={() => setActive((current) => (current + 1) % SLIDES.length)}
                  style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
                  className="absolute inset-0 origin-left rounded-full bg-primary-500 [animation-fill-mode:forwards] [animation-name:ct-slide-progress] [animation-timing-function:linear] group-hover/hero:[animation-play-state:paused] motion-reduce:[animation-name:none]"
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
