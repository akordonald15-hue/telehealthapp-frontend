import { BrandLockup } from "@/components/brand/brand-lockup";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,164,215,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(66,107,179,0.12),transparent_28%),linear-gradient(180deg,#F4F7FB_0%,#EEF4FB_45%,#FFFFFF_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="ct-page-transition w-full max-w-md">
          <div className="lf-panel rounded-[28px] p-6 shadow-[0_32px_80px_-50px_rgba(15,23,42,0.4)] sm:p-8">
            <div className="mb-8 flex flex-col items-center text-center">
              <BrandLockup href="/" wordmark="image" wordmarkClassName="h-7 max-w-[176px]" />
              <h1 className="ct-dashboard-title mt-6 text-[#1F2937]">{title}</h1>
              {subtitle ? <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">{subtitle}</p> : null}
            </div>

            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
