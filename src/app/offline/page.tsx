import Link from "next/link";

import { BrandLockup } from "@/components/brand/brand-lockup";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(124,164,215,0.18),_transparent_28%),linear-gradient(180deg,#F8FBFF_0%,#F4F7FB_42%,#FFFFFF_100%)] px-4 py-10">
      <div className="w-full max-w-lg rounded-[28px] border border-white/80 bg-white/95 p-8 text-center shadow-[0_24px_72px_-44px_rgba(15,23,42,0.34)] backdrop-blur">
        <div className="mx-auto flex justify-center">
          <BrandLockup href="/" wordmark="image" wordmarkClassName="h-8 max-w-[190px]" />
        </div>
        <h1 className="mt-8 font-heading text-3xl font-semibold tracking-[-0.03em] text-[#1F2937]">You&apos;re offline</h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          Some Caretekk features require internet access. Booking, payments, chat, and live nurse tracking will resume when your connection returns.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          If you already opened the Caretekk landing page before going offline, some saved assets may still be available.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="lf-btn lf-btn-primary flex-1">
            Go to home
          </Link>
          <Link href="/offline" className="lf-btn lf-btn-secondary flex-1">
            Try again
          </Link>
        </div>
      </div>
    </main>
  );
}
