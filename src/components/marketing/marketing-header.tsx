"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { marketingNavItems } from "@/features/marketing/data";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="ct-nav-surface sticky top-0 z-50">
      <nav className="lf-shell flex min-h-[76px] items-center justify-between gap-4 py-2 sm:min-h-[84px] sm:gap-6" aria-label="Main navigation">
        <BrandLockup href="/" wordmark="image" className="transition duration-200 hover:opacity-90" wordmarkClassName="h-6 max-w-[152px] sm:h-7 sm:max-w-[176px]" />

        <div className="hidden items-center gap-7 lg:flex">
          {marketingNavItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-[10px] text-[0.95rem] font-semibold text-[#475467] transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="rounded-[10px] px-1 text-sm font-semibold text-[#475467] transition hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15">
            Sign in
          </Link>
          <Link href="/register" className="lf-btn lf-btn-primary min-h-[48px] px-5 text-sm shadow-[0_18px_34px_rgba(66,107,179,0.2)]">
            Get started
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[14px] border border-white/80 bg-white/92 text-[#1F2937] shadow-[0_14px_28px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 lg:hidden"
        >
          <span className="sr-only">Toggle navigation</span>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-white/80 bg-[rgba(247,250,255,0.96)] backdrop-blur-xl lg:hidden" id="mobile-nav">
          <div className="lf-shell grid gap-2 py-4">
            {marketingNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[14px] px-3 py-3 text-sm font-semibold text-[#475467] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-[14px] px-3 py-3 text-sm font-semibold text-[#475467] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15"
            >
              Sign in
            </Link>
            <Link href="/register" onClick={() => setOpen(false)} className="lf-btn lf-btn-primary text-sm">
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
