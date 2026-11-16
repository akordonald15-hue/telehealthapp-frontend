"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-[100dvh] place-items-center px-6 py-16">
      <div className="lf-shell grid max-w-2xl gap-6 text-center">
        <p className="ct-caption text-danger">Something went wrong</p>
        <h1 className="ct-hero-title text-ash-800">We hit an unexpected error.</h1>
        <p className="text-base leading-7 text-ash-500">
          Please try again. If the problem keeps happening, head back home and we&rsquo;ll get you to the right place.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button variant="primary" onClick={reset}>Try again</Button>
          <Link href="/">
            <Button variant="secondary">Go to homepage</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
