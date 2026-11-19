"use client";

import Image from "next/image";
import { useState } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

import styles from "./auth-hero-panel.module.css";

const SLIDES = ["/img/Dr michael Idam.jpg", "/img/Dr effiong Okon.jpg", "/img/Dr Paul Chinonso.jpg"];
const SLIDE_DURATION_MS = 6000;

export function AuthHeroPanel() {
  const [active, setActive] = useState(0);

  return (
    <aside className="group/hero relative hidden overflow-hidden rounded-lg bg-black-800 lg:sticky lg:top-3 lg:flex lg:h-[calc(100dvh-1.5rem)] lg:min-h-[560px] lg:flex-col lg:justify-between lg:self-start lg:p-12 xl:pb-[68px] xl:pl-[88px] xl:pr-12 xl:pt-[60px]">
      <div aria-hidden="true" className="absolute inset-0">
        {SLIDES.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt=""
            fill
            sizes="(min-width: 1024px) 50vw, 1px"
            loading={index === 0 ? "eager" : "lazy"}
            className={cn(
              "object-cover object-[50%_20%] [transition:opacity_1.2s_ease-in-out,scale_7s_ease-out] motion-reduce:scale-100 motion-reduce:[transition:opacity_1.2s_ease-in-out]",
              index === active ? "scale-100 opacity-100" : "scale-[1.08] opacity-0",
            )}
          />
        ))}
      </div>
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

      <div className="relative z-10 max-w-[579px] text-white">
        <p className="type-heading-4 xl:type-heading-3">A Better place to get care that puts your family first</p>
        <p className="type-body-giant mt-4 text-white">With {BRAND_NAME} you can find care solutions</p>
        <div aria-hidden="true" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-2">
          {SLIDES.map((src, index) => (
            <button
              key={src}
              type="button"
              tabIndex={-1}
              onClick={() => setActive(index)}
              className={cn(
                "relative h-2 cursor-pointer overflow-hidden rounded-full bg-primary-100 transition-[width,background-color] duration-500 ease-out",
                index === active ? "w-6" : "w-2 hover:bg-primary-200",
              )}
            >
              {index === active ? (
                <span
                  onAnimationEnd={() => setActive((current) => (current + 1) % SLIDES.length)}
                  style={{ animationDuration: `${SLIDE_DURATION_MS}ms` }}
                  className={cn(
                    styles.progress,
                    "absolute inset-0 origin-left rounded-full bg-primary-400 group-hover/hero:[animation-play-state:paused]",
                  )}
                />
              ) : null}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
