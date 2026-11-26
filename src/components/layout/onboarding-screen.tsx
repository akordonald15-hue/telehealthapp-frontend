import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";

// Full-screen onboarding surface (Figma 2545:2617). White page, logo at
// 100/50, a 598px column centred in the viewport, and a bottom-right footer
// at 100/56 on desktop. Below lg the logo and footer stay in flow so a tall
// form scrolls instead of overlapping them.
export function OnboardingScreen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <main className="relative flex min-h-dvh flex-col bg-white">
      <header className="flex items-center px-6 pt-6 sm:px-8 lg:absolute lg:left-[100px] lg:top-[50px] lg:px-0 lg:pt-0">
        <BrandLockup
          gapClassName="gap-3"
          iconSizeClassName="h-[46px] w-[46px]"
          wordmarkSizeClassName="h-8 max-w-[127px]"
        />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-8 lg:px-[100px] lg:pb-36 lg:pt-28">
        <div className="w-full max-w-[598px]">{children}</div>
      </div>

      {footer ? (
        <footer className="px-6 pb-6 pt-2 sm:px-8 lg:absolute lg:inset-x-[100px] lg:bottom-[56px] lg:px-0 lg:pb-0 lg:pt-0">
          {footer}
        </footer>
      ) : null}
    </main>
  );
}
