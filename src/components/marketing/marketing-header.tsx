"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { marketingNavItems } from "@/features/marketing/data";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/85 backdrop-blur-xl">
      <nav className="lf-shell flex min-h-[72px] items-center justify-between gap-4 sm:min-h-[76px] sm:gap-6" aria-label="Main navigation">
        <BrandLockup href="/" wordmark="image" wordmarkClassName="h-6 max-w-[152px] sm:h-7 sm:max-w-[176px]" />

        <div className="hidden items-center gap-6 lg:flex">
          {marketingNavItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-bold text-[#475467] transition hover:text-[var(--primary)]">
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/login" className="text-sm font-bold text-[#475467] transition hover:text-[var(--primary)]">
            Sign in
          </Link>
          <Link href="/register" className="lf-btn lf-btn-primary min-h-[48px] px-5 text-sm">
            Get started as a patient
          </Link>
        </div>

        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white text-[#1F2937] shadow-[0_8px_20px_rgba(15,23,42,0.05)] lg:hidden"
        >
          <span className="sr-only">Toggle navigation</span>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-[#E5E7EB] bg-white lg:hidden" id="mobile-nav">
          <div className="lf-shell grid gap-2 py-4">
            {marketingNavItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-[12px] px-3 py-3 text-sm font-bold text-[#475467] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
              >
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-[12px] px-3 py-3 text-sm font-bold text-[#475467] transition hover:bg-[var(--primary-soft)] hover:text-[var(--primary)]"
            >
              Sign in
            </Link>
            <Link href="/register" onClick={() => setOpen(false)} className="lf-btn lf-btn-primary text-sm">
              Get started as a patient
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
