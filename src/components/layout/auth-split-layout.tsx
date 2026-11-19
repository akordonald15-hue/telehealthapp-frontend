import Link from "next/link";

import { AuthHeroPanel } from "@/components/layout/auth-hero-panel";

export function AuthSplitLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-white lg:grid lg:grid-cols-2 lg:p-3">
      <AuthHeroPanel />

      <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6 lg:min-h-[calc(100dvh-1.5rem)] lg:py-8">
        {children}
        <Link href="/" className="type-body-sm mt-6 text-grey-500 transition hover:text-primary-500 lg:hidden">
          &larr; Back to homepage
        </Link>
      </div>
    </main>
  );
}
