import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-[100dvh] place-items-center px-6 py-16">
      <div className="lf-shell grid max-w-2xl gap-6 text-center">
        <p className="ct-caption text-primary">Error 404</p>
        <h1 className="ct-hero-title text-ash-800">We couldn&rsquo;t find that page.</h1>
        <p className="text-base leading-7 text-ash-500">
          The page you&rsquo;re looking for may have moved, been removed, or never existed. Head back home and we&rsquo;ll get you to the right place.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/">
            <Button variant="primary">Go to homepage</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Open dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
