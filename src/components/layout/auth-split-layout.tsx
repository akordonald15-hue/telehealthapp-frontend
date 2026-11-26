import type { ReactNode } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";

type AuthSplitLayoutProps = {
  children: ReactNode;
  visual: ReactNode;
};

export function AuthSplitLayout({ children, visual }: AuthSplitLayoutProps) {
  return (
    <main className="min-h-dvh bg-white p-4 lg:p-3">
      <div className="mx-auto grid w-full max-w-[1512px] min-h-[calc(100dvh-2rem)] gap-8 lg:min-h-[calc(100dvh-1.5rem)] lg:grid-cols-[minmax(0,744px)_minmax(450px,1fr)] lg:gap-8">
        {visual}

        <div className="flex min-w-0 items-center justify-center">
          <div className="w-full max-w-[450px]">
            <div className="mb-8 flex justify-center lg:hidden">
              <BrandLockup href="/" />
            </div>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}
