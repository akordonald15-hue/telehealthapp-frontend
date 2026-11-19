import Link from "next/link";

import { cn } from "@/lib/utils";

export function AuthSplitLayout({
  panel,
  panelSide = "left",
  inert,
  children,
}: {
  panel: React.ReactNode;
  panelSide?: "left" | "right";
  inert?: boolean;
  children: React.ReactNode;
}) {
  return (
    <main
      inert={inert}
      className={cn(
        "min-h-dvh bg-white lg:grid lg:p-3",
        panelSide === "left" ? "lg:grid-cols-2" : "lg:grid-cols-[minmax(0,686fr)_minmax(0,802fr)]",
      )}
    >
      {panelSide === "left" ? panel : null}

      <div
        className={cn(
          "flex min-h-dvh flex-col items-center justify-center px-4 py-10 sm:px-6 lg:min-h-[calc(100dvh-1.5rem)] lg:py-8",
          panelSide === "right" && "lg:px-4 xl:pl-0 xl:pr-[60px]",
        )}
      >
        {children}
        <Link href="/" className="type-body-sm mt-6 text-grey-500 transition hover:text-primary-500 lg:hidden">
          &larr; Back to homepage
        </Link>
      </div>

      {panelSide === "right" ? panel : null}
    </main>
  );
}
