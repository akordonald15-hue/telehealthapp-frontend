"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Praise } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { HousePlus, Pause, Play } from "lucide-react";
import { useRef, useState } from "react";

import { ArrowLongRightIcon } from "@/components/marketing/marketing-icons";
import { heroSlides } from "@/features/marketing/data";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const praise = Praise({ weight: "400", subsets: ["latin"] });

const SLIDE_INTERVAL_MS = 6000;
const STAGGER = 0.07;
const ENTER_AT = 0.38;
const BACKGROUND_OPACITY = 0.2;

const imagePriority = (index: number) =>
  index === 0 ? { preload: true } : { loading: "eager" as const, fetchPriority: "low" as const };

export function HeroSlideshow() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [rotationStopped, setRotationStopped] = useState(false);
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
      if (paused || rotationStopped || !onScreen || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      gsap.delayedCall(SLIDE_INTERVAL_MS / 1000, () => setActive((index) => (index + 1) % heroSlides.length));
    },
    { dependencies: [active, paused, rotationStopped, onScreen], revertOnUpdate: true },
  );

  useGSAP(
    () => {
      const from = previous.current;
      previous.current = active;
      if (from === active) {
        return;
      }
      transition.current?.progress(1).kill();

      const details = (slide: number, motion: "text" | "pill" | "image" | "background") =>
        `[data-slide="${slide}"] [data-motion="${motion}"]`;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set([details(from, "text"), details(from, "image"), details(from, "background")], { opacity: 0 });
        gsap.set([details(active, "text"), details(active, "image")], { opacity: 1, x: 0 });
        gsap.set(details(active, "background"), { opacity: BACKGROUND_OPACITY });
        return;
      }

      transition.current = gsap
        .timeline()
        .to(details(from, "text"), { x: -56, opacity: 0, duration: 0.4, ease: "power2.inOut", stagger: STAGGER }, 0)
        .to(details(from, "image"), { x: -160, opacity: 0, duration: 0.5, ease: "power2.inOut" }, STAGGER)
        .to(details(from, "background"), { opacity: 0, duration: 0.8, ease: "power1.inOut" }, 0)
        .fromTo(
          details(active, "background"),
          { opacity: 0 },
          { opacity: BACKGROUND_OPACITY, duration: 0.8, ease: "power1.inOut" },
          0.2,
        )
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
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {heroSlides.map((slide, index) => (
          <div key={slide.background} data-slide={index}>
            <Image
              src={slide.background}
              alt=""
              width={2000}
              height={1400}
              {...imagePriority(index)}
              sizes="150vw"
              data-motion="background"
              style={{ opacity: index === 0 ? BACKGROUND_OPACITY : 0 }}
              className={cn("absolute h-auto max-w-none mix-blend-screen", slide.backgroundClassName)}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.22)_1.2px,transparent_1.6px)] bg-[size:16px_16px]" />
      </div>

      <div className="relative">
        <div className="inline-flex h-[45.5px] items-center gap-[10px] rounded-bl-[16px] rounded-tr-[16px] bg-[#60A5FA]/50 px-[30px] text-[14.85px] font-medium leading-none text-white max-sm:px-5">
          <span className="h-[11px] w-[11px] rounded-full bg-white/50" />
          Trusted Digital Healthcare
          <span className="h-[11px] w-[11px] rounded-full bg-white/50" />
        </div>

        <div aria-live={paused || rotationStopped ? "polite" : "off"}>
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
                      praise.className,
                      "ml-[12.5px] inline-flex h-[60.9px] items-center rounded-bl-[18px] rounded-tl-[4px] rounded-tr-[18px] border-b-[3.2px] border-white bg-[#1E40AF] px-[33px] text-[44px] font-normal max-sm:h-[50px] max-sm:px-5 max-sm:text-[34px]",
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
                    "mx-auto text-[16.5px] font-normal leading-[25.15px] text-white",
                    slide.textClassName,
                    hiddenUntilShown(index),
                  )}
                >
                  {slide.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[50.5px] flex justify-center gap-[33.9px] max-sm:mt-[35px] max-sm:flex-col max-sm:gap-4">
          <Link
            href="/register"
            className="inline-flex h-[58.8px] w-[249.5px] items-center justify-center gap-[17.6px] rounded-full bg-[#1E40AF] text-[18px] font-medium leading-none text-white shadow-[0_16px_32px_-14px_rgba(11,28,48,0.55)] hover:bg-[#1E3A8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 max-sm:w-full"
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

        <div
          role="group"
          aria-label="Highlight controls"
          className="pointer-events-none absolute inset-x-0 z-10 mt-[22px] flex items-center justify-center gap-1 opacity-0 focus-within:pointer-events-auto focus-within:opacity-100"
        >
          {heroSlides.map((slide, index) => (
            <button
              key={slide.highlight}
              type="button"
              aria-label={index === 0 ? "Show consultation highlight" : "Show homecare highlight"}
              aria-pressed={index === active}
              onClick={() => {
                setRotationStopped(true);
                setActive(index);
              }}
              className="group inline-flex h-6 items-center justify-center px-1 focus-visible:outline-none"
            >
              <span
                className={cn(
                  "block h-[7px] rounded-full transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#2563EB]",
                  index === active ? "w-[26px] bg-white" : "w-[7px] bg-white/45 group-hover:bg-white/70",
                )}
              />
            </button>
          ))}
          <button
            type="button"
            aria-label={rotationStopped ? "Resume" : "Pause"}
            onClick={() => setRotationStopped((value) => !value)}
            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-white/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {rotationStopped ? (
              <Play className="h-[13px] w-[13px] fill-current" strokeWidth={0} />
            ) : (
              <Pause className="h-[13px] w-[13px] fill-current" strokeWidth={0} />
            )}
          </button>
        </div>

        <div className="relative mx-auto mt-[75px] grid aspect-[850/447] w-[850px] max-w-full max-sm:aspect-[4/3]">
          <HeroCircles />
          {heroSlides.map((slide, index) => (
            <div key={slide.image} {...slideLayer(index, "relative")}>
              <div
                data-motion="image"
                data-hero-image
                className={cn(
                  "absolute inset-x-0 bottom-0 mx-auto aspect-[3632/2448] w-[69%] will-change-[transform,opacity] max-sm:w-full",
                  hiddenUntilShown(index),
                )}
              >
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  {...imagePriority(index)}
                  sizes="(min-width: 1024px) 45vw, (min-width: 640px) 69vw, 100vw"
                  className="object-contain object-bottom"
                />
              </div>
            </div>
          ))}
        </div>
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
      className="pointer-events-none absolute inset-0 h-full w-full max-sm:origin-bottom max-sm:scale-150 max-sm:[&_circle]:[vector-effect:non-scaling-stroke]"
    >
      <circle cx={425} cy={361} r={311} fill="white" fillOpacity={0.04} stroke="white" strokeOpacity={0.3} strokeWidth={1.2} />
      <circle cx={425} cy={347} r={258} fill="white" fillOpacity={0.02} stroke="white" strokeOpacity={0.22} strokeWidth={1.2} />
    </svg>
  );
}
