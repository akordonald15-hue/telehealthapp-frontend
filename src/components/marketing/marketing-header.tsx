"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { Menu, X } from "lucide-react";
import { useRef, useState } from "react";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { ArrowLongRightIcon } from "@/components/marketing/marketing-icons";
import { WaveButton } from "@/components/ui/wave-button";
import { marketingNavItems } from "@/features/marketing/data";

gsap.registerPlugin(useGSAP);

const ACTIVE_HREF = "#home";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const header = headerRef.current;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(header, { visibility: "visible" });
        return;
      }

      const settle = "transform,opacity,visibility";
      gsap
        .timeline({ defaults: { ease: "expo.out", clearProps: settle } })
        .set(header, { visibility: "visible", clearProps: "" })
        .from('[data-intro="bar"]', { y: -28, scale: 0.98, autoAlpha: 0, duration: 0.9 })
        .from('[data-intro="logo"]', { x: -16, autoAlpha: 0, duration: 0.8 }, 0.2)
        .from('[data-intro="link"]', { y: -12, autoAlpha: 0, duration: 0.7, stagger: 0.06 }, 0.28)
        .from('[data-intro="cta"]', { x: 16, autoAlpha: 0, duration: 0.8 }, 0.42);
    },
    { scope: headerRef },
  );

  return (
    <header
      ref={headerRef}
      className="invisible absolute left-[16.4px] right-[24.9px] top-[22.2px] z-20 text-left max-lg:inset-x-3 max-lg:top-3"
    >
      <nav data-intro="bar" className="rounded-[12.7px] bg-white" aria-label="Main navigation">
        <div className="flex h-[72.5px] items-center pl-[35.9px] pr-[40.7px] max-lg:h-16 max-lg:pl-2 max-lg:pr-3">
          <div data-intro="logo" className="flex shrink-0">
            <BrandLockup
              href="/"
              wordmark="image"
              gapClassName="gap-[3.7px]"
              iconSizeClassName="h-[40.9px] w-[40.9px]"
              wordmarkSizeClassName="h-[29.05px]"
            />
          </div>

          <div className="ml-[40px] flex items-center gap-[20.6px] max-lg:hidden">
            {marketingNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                data-intro="link"
                aria-current={item.href === ACTIVE_HREF ? "page" : undefined}
                className={`ct-underline-link rounded-md text-[15.25px] leading-none transition-colors [--underline:#1E40AF] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 ${item.href === ACTIVE_HREF ? "font-medium text-[#1E40AF]" : "text-[#243345]"
                  }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <WaveButton
            href="#contact"
            data-intro="cta"
            className="ml-auto h-[49.7px] w-[184.1px] gap-[18.3px] rounded-[13.8px] text-[15.75px] font-medium leading-none max-lg:hidden"
          >
            Contact Us
            <ArrowLongRightIcon className="h-[17px] w-[23.4px]" />
          </WaveButton>

          <button
            type="button"
            data-intro="cta"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
            className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white text-[#1F2937] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 lg:hidden"
          >
            <span className="sr-only">Toggle navigation</span>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {open ? (
          <div className="grid gap-1 border-t border-[#E5E7EB] px-3 pb-4 pt-3 lg:hidden" id="mobile-nav">
            {marketingNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-[10px] px-3 py-3 text-base transition hover:bg-[#EFF4FF] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 ${item.href === ACTIVE_HREF ? "font-medium text-[#1E40AF]" : "text-[#243345]"
                  }`}
              >
                {item.label}
              </a>
            ))}
            <WaveButton
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-2 h-[50px] gap-3 rounded-[12px] text-base font-medium"
            >
              Contact Us
              <ArrowLongRightIcon className="h-[15px] w-[21px]" />
            </WaveButton>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
