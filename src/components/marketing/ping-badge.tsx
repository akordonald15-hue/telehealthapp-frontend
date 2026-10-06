"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);
export function PingBadge({ dark = false, delay = 0, children }: { dark?: boolean; delay?: number; children: ReactNode }) {
  const rootRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const ping = gsap
        .timeline({ repeat: -1, repeatDelay: 2.4, delay, paused: true })
        .fromTo("[data-ping]", { scale: 1, opacity: 0.8 }, { scale: 1.45, opacity: 0, duration: 1.4, ease: "power2.out" }, 0)
        .to(
          "[data-ping-core]",
          { scale: 1.08, transformOrigin: "50% 50%", duration: 0.18, ease: "power2.out", yoyo: true, repeat: 1 },
          0,
        );

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? ping.play() : ping.pause()),
      });
    },
    { scope: rootRef },
  );

  return (
    <span ref={rootRef} className="relative flex h-[92px] w-[92px] shrink-0">
      <span data-ping aria-hidden className={cn("absolute inset-0 rounded-full opacity-0", dark ? "bg-[#BFDBFE]/25" : "bg-[#BFDBFE]")} />
      {children}
    </span>
  );
}
