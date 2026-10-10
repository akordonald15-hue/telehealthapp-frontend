"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef, type ReactNode } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

export function RevealLines({ children, className }: { children: ReactNode; className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      SplitText.create(root.children, {
        type: "lines",
        mask: "lines",
        aria: "none",
        autoSplit: true,
        onSplit: (split) =>
          gsap.from(split.lines, {
            yPercent: 100,
            duration: 1.2,
            ease: "power4.out",
            stagger: 0.14,
            scrollTrigger: { trigger: root, start: "top 85%", once: true },
            onComplete: () => split.revert(),
          }),
      });
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  );
}
