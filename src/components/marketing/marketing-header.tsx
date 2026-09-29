"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { ArrowLongRightIcon } from "@/components/marketing/marketing-icons";
import { marketingNavItems } from "@/features/marketing/data";

const ACTIVE_HREF = "#home";

/**
 * Rendered inside the hero card (not pinned), positioned in design px like the rest of the hero.
 * The design's pill sits slightly left of centre (16.4px left inset, 24.9px right).
 */
export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute left-[16.4px] right-[24.9px] top-[22.2px] z-20 text-left max-lg:inset-x-3 max-lg:top-3">
      <nav className="rounded-[12.7px] bg-white" aria-label="Main navigation">
        <div className="flex h-[72.5px] items-center pl-[35.9px] pr-[40.7px] max-lg:h-16 max-lg:pl-2 max-lg:pr-3">
          <BrandLockup
            href="/"
            wordmark="image"
            gapClassName="gap-[3.7px]"
            iconSizeClassName="h-[40.9px] w-[40.9px]"
            wordmarkSizeClassName="h-[29.05px]"
          />

          <div className="ml-[40px] flex items-center gap-[20.6px] max-lg:hidden">
            {marketingNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                aria-current={item.href === ACTIVE_HREF ? "page" : undefined}
                className={`rounded-md text-[15.25px] leading-none transition hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 ${
                  item.href === ACTIVE_HREF ? "font-medium text-[#1E40AF]" : "text-[#243345]"
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          <a
            href="#contact"
            className="ml-auto inline-flex h-[49.7px] w-[184.1px] items-center justify-center gap-[18.3px] rounded-[13.8px] bg-[#1E40AF] text-[15.75px] font-medium leading-none text-white transition hover:bg-[#1E3A8A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/25 max-lg:hidden"
          >
            Contact Us
            <ArrowLongRightIcon className="h-[17px] w-[23.4px]" />
          </a>

          <button
            type="button"
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
                className={`rounded-[10px] px-3 py-3 text-base transition hover:bg-[#EFF4FF] hover:text-[#1E40AF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 ${
                  item.href === ACTIVE_HREF ? "font-medium text-[#1E40AF]" : "text-[#243345]"
                }`}
              >
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex h-[50px] items-center justify-center gap-3 rounded-[12px] bg-[#1E40AF] text-base font-medium text-white transition hover:bg-[#1E3A8A]"
            >
              Contact Us
              <ArrowLongRightIcon className="h-[15px] w-[21px]" />
            </a>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
