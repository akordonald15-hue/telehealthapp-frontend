"use client";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { cn } from "@/lib/utils";

type FullPageLoaderProps = {
  title?: string;
  subtitle?: string;
  className?: string;
};

type InlineLoaderProps = {
  label?: string;
  className?: string;
  compact?: boolean;
};

type PageTransitionLoaderProps = {
  label?: string;
  className?: string;
};

function LoaderPulseMark({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex h-16 w-16 items-center justify-center", className)}>
      <span className="absolute inset-0 rounded-full bg-[rgba(66,107,179,0.12)] animate-[caretekk-ring_1.8s_ease-out_infinite]" />
      <span className="absolute inset-[10px] rounded-full border border-[rgba(66,107,179,0.18)] bg-white/90 shadow-[0_12px_30px_-20px_rgba(37,99,235,0.35)]" />
      <span className="relative z-10">
        <BrandLockup wordmark="none" logoClassName="h-10 w-10" />
      </span>
    </div>
  );
}

function LoaderDots() {
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden="true">
      <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-[caretekk-dot_1s_ease-in-out_infinite]" />
      <span className="h-2 w-2 rounded-full bg-[rgba(66,107,179,0.72)] animate-[caretekk-dot_1s_ease-in-out_0.14s_infinite]" />
      <span className="h-2 w-2 rounded-full bg-[rgba(66,107,179,0.45)] animate-[caretekk-dot_1s_ease-in-out_0.28s_infinite]" />
    </span>
  );
}

export function FullPageLoader({
  title = "Preparing your Caretekk workspace",
  subtitle = "Please hold on while we secure the next step.",
  className,
}: FullPageLoaderProps) {
  return (
    <main
      className={cn(
        "flex min-h-[60dvh] items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(124,164,215,0.16),_transparent_28%),linear-gradient(180deg,#F8FBFF_0%,#F4F7FB_42%,#FFFFFF_100%)] px-4 py-10",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-full max-w-lg rounded-[8px] border border-white/80 bg-white/95 px-6 py-10 text-center shadow-[0_24px_72px_-44px_rgba(15,23,42,0.34)] backdrop-blur">
        <div className="flex justify-center">
          <LoaderPulseMark />
        </div>
        <h1 className="mt-6 font-heading text-[1.65rem] font-semibold tracking-[-0.03em] text-[#1F2937] sm:text-3xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">{subtitle}</p>
        <div className="mt-5 flex items-center justify-center gap-3 text-sm font-medium text-slate-500">
          <LoaderDots />
        </div>
      </div>
    </main>
  );
}

export function InlineLoader({
  label = "Preparing your Caretekk workspace",
  className,
  compact = false,
}: InlineLoaderProps) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[rgba(219,229,241,0.92)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,251,255,0.98)_100%)] px-4 py-4 shadow-[0_18px_50px_-40px_rgba(15,23,42,0.24)]",
        compact ? "px-4 py-3" : "px-5 py-5",
        className,
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[var(--primary-soft)] text-[var(--primary)]">
          <LoaderDots />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1F2937]">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function PageTransitionLoader({
  label = "Connecting you to Caretekk",
  className,
}: PageTransitionLoaderProps) {
  return (
    <main
      className={cn("grid min-h-[60dvh] place-items-center px-6 py-16", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="rounded-[8px] border border-white/80 bg-white/92 px-6 py-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.28)] backdrop-blur">
        <div className="flex items-center gap-4">
          <LoaderPulseMark className="h-14 w-14" />
          <div>
            <p className="font-heading text-lg font-semibold tracking-[-0.03em] text-[#1F2937]">{label}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
              <LoaderDots />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
