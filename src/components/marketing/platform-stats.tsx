"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

import { platformStats } from "@/features/marketing/data";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const formatNumber = new Intl.NumberFormat("en-US").format;
export function PlatformStats() {
  const rootRef = useRef<HTMLDListElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((number, index) => {
        const counter = { value: 0 };
        number.textContent = formatNumber(0);
        gsap.to(counter, {
          value: Number(number.dataset.count),
          duration: 1.8,
          delay: index * 0.12,
          ease: "power3.out",
          snap: { value: 1 },
          onUpdate: () => {
            number.textContent = formatNumber(counter.value);
          },
          scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <dl ref={rootRef} className="mx-auto grid w-[900px] max-w-full grid-cols-2 gap-y-6 md:grid-cols-4">
      {platformStats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col-reverse items-center justify-end py-[20px] text-center md:border-l md:border-[#C8CBE6] md:first:border-l-0"
        >
          <dt className="mt-[12px] text-[15.5px] leading-tight text-[#4B4B5C] max-sm:text-[14px]">{stat.label}</dt>
          <dd className="text-[46px] font-bold leading-none tabular-nums text-[#3472EF] max-sm:text-[36px]">
            <span className="sr-only">
              {formatNumber(stat.value)}
              {stat.suffix}
            </span>
            <span aria-hidden="true">
              <span data-count={stat.value}>{formatNumber(stat.value)}</span>
              {stat.suffix}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
