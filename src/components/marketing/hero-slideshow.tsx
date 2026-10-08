"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { HousePlus } from "lucide-react";
import { useRef, useState } from "react";

import { ArrowLongRightIcon } from "@/components/marketing/marketing-icons";
import { heroSlides } from "@/features/marketing/data";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const SLIDE_INTERVAL_MS = 8000;
const STAGGER = 0.07;
const ENTER_AT = 0.38;

export function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const previous = useRef(active);
  const transition = useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => setOnScreen(self.isActive),
    });
  });

  useGSAP(
    () => {
      if (paused || !onScreen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      gsap.delayedCall(SLIDE_INTERVAL_MS / 1000, () => setActive((index) => (index + 1) % heroSlides.length));
    },
    { dependencies: [active, paused, onScreen], revertOnUpdate: true },
  );

  const { contextSafe } = useGSAP(
    () => {
      const from = previous.current;
      previous.current = active;
      if (from === active) {
        return;
      }
      transition.current?.progress(1).kill();

      const details = (slide: number, motion: "text" | "pill" | "image") => `[data-slide="${slide}"] [data-motion="${motion}"]`;

      transition.current = gsap
        .timeline()
        .to(details(from, "text"), { x: -56, opacity: 0, duration: 0.4, ease: "power2.inOut", stagger: STAGGER }, 0)
        .to(details(from, "image"), { x: -160, opacity: 0, duration: 0.5, ease: "power2.inOut" }, STAGGER)
        .fromTo(
          details(active, "text"),
          { x: 56, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.8, ease: "expo.out", stagger: STAGGER },
          ENTER_AT,
        )
        .fromTo(
          details(active, "pill"),
          { scale: 0.7, transformOrigin: "0% 100%" },
          { scale: 1, duration: 0.7, ease: "back.out(1.8)" },
          ENTER_AT + STAGGER,
        )
        .fromTo(
          details(active, "image"),
          { x: 160, opacity: 0 },
          { x: 0, opacity: 1, duration: 1, ease: "expo.out" },
          ENTER_AT + STAGGER,
        );
    },
    { scope: rootRef, dependencies: [active] },
  );

  const revealImage = contextSafe((image: HTMLImageElement) => {
    gsap.to(image, { opacity: 1, duration: 0.6, ease: "power2.out" });
  });

  const slideLayer = (index: number, className?: string) => {
    const isActive = index === active;
    return {
      "data-slide": index,
      "aria-hidden": !isActive,
      inert: !isActive,
      className: cn("[grid-area:1/1]", !isActive && "pointer-events-none", className),
    };
  };

  const hiddenUntilShown = (index: number) => index !== 0 && "opacity-0";

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Highlights"
      ref={rootRef}
      className="relative"
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div className="inline-flex h-[47.6px] items-center gap-[8px] rounded-[22px] rounded-br-none rounded-tl-[2px] bg-[#60A5FA80] pl-[30.2px] pr-[30px] text-[15.15px] font-medium leading-none text-white max-sm:px-5">
        <span className="h-[10.6px] w-[10.6px] rounded-full bg-[#B3C2F7]" />
        Trusted Digital Healthcare
        <span className="h-[10.6px] w-[10.6px] rounded-full bg-[#B3C2F7]" />
      </div>

      <div aria-live={paused ? "polite" : "off"}>
        <h1 className="mt-[22.8px] grid text-[40.25px] font-bold leading-none text-white max-sm:text-[30px] max-sm:leading-[1.15]">
          {heroSlides.map((slide, index) => (
            <span key={slide.highlight} {...slideLayer(index)}>
              <span
                data-motion="text"
                className={cn(
                  "flex h-[60.9px] items-center justify-center max-lg:h-auto max-lg:flex-wrap max-lg:gap-y-3",
                  hiddenUntilShown(index),
                )}
              >
                <span>{slide.lead}</span>
                <span
                  data-motion="pill"
                  className={cn(
                    "ml-[12.5px] inline-flex h-[60.9px] items-center rounded-bl-[18px] rounded-tr-[18px] border-b-[3.2px] border-white pl-[10.3px] pr-[16.2px] text-[31.75px] max-sm:h-[48px] max-sm:text-[24px]",
                    slide.highlightClassName,
                  )}
                >
                  {slide.highlight}
                </span>
              </span>
              <span data-motion="text" className={cn("mt-[7.7px] block max-sm:mt-3", hiddenUntilShown(index))}>
                {slide.tail}
              </span>
            </span>
          ))}
        </h1>

        <div className="mt-[23.9px] grid">
          {heroSlides.map((slide, index) => (
            <div key={slide.highlight} {...slideLayer(index)}>
              <p
                data-motion="text"
                className={cn(
                  "mx-auto max-w-[480px] text-[16.5px] font-light leading-[25.15px] text-[#F7FAFE]",
                  hiddenUntilShown(index),
                )}
              >
                {slide.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[35.15px] flex justify-center gap-[33.9px] max-sm:flex-col max-sm:gap-4">
        <Link
          href="/register"
          className="inline-flex h-[58.8px] w-[249.5px] items-center justify-center gap-[17.6px] rounded-full bg-[#1E40AF] text-[18px] font-medium leading-none text-white shadow-[0_16px_32px_-14px_rgba(30,64,175,0.6)] hover:bg-[#1E3A8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 max-sm:w-full"
        >
          Talk to a Doctor
          <ArrowLongRightIcon className="h-[17px] w-[23.4px]" />
        </Link>
        <Link
          href="/register"
          className="inline-flex h-[58.8px] w-[249.5px] items-center justify-center gap-[16.4px] rounded-full border border-white text-[18px] font-medium leading-none text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 max-sm:w-full"
        >
          Book Homecare
          <HousePlus className="h-[28px] w-[28px]" strokeWidth={1.7} />
        </Link>
      </div>

      <div className="relative mx-auto mt-[48px] grid h-[447px] w-[850px] max-w-full max-lg:left-1/2 max-lg:max-w-none max-lg:-translate-x-1/2 max-sm:h-[316px] max-sm:w-[600px] sm:max-lg:aspect-[850/447] sm:max-lg:h-auto sm:max-lg:w-[min(148%,1100px)]">
        <HeroCircles />
        {heroSlides.map((slide, index) => (
          <div key={slide.image} {...slideLayer(index, "relative")}>           <div
              data-motion="image"
              className={cn("absolute inset-0 will-change-[transform,opacity]", hiddenUntilShown(index))}
            >
              <Image
                src={slide.image}
                alt={slide.alt}
                fill
                preload={index === 0}
                loading={index === 0 ? undefined : "eager"}
                fetchPriority={index === 0 ? "high" : "low"}
                sizes="(min-width: 1920px) 1632px, (min-width: 1024px) 85vw, (min-width: 640px) 1100px, 600px"
                onLoad={(event) => revealImage(event.currentTarget)}
                className="object-contain object-bottom opacity-0"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeroCircles() {
  return (
    <svg
      viewBox="0 0 850 447"
      preserveAspectRatio="xMidYMax meet"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <circle cx={424.9} cy={423.9} r={423.1} fill="white" fillOpacity={0.06} stroke="white" strokeOpacity={0.26} strokeWidth={1.6} />
      <circle cx={430.6} cy={432.9} r={369.5} fill="white" fillOpacity={0.02} stroke="white" strokeOpacity={0.2} strokeWidth={1.6} />
    </svg>
  );
}
