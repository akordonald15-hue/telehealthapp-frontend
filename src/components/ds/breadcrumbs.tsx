import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

// Figma "DESIGN SYSTEM" → Breadcrumbs: 14/16 semibold; links grey-500, current page black-500.
export function Breadcrumbs({
  items,
  className,
}: {
  /** The last item is the current page and is not linked. */
  items: Array<{ label: string; href?: string }>;
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-2 font-inter-tight text-sm font-semibold leading-4">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {current || !item.href ? (
                <span aria-current={current ? "page" : undefined} className={cn(current ? "text-black-500" : "text-grey-500")}>
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="rounded-[4px] text-grey-500 transition hover:text-primary-500 focus-visible:text-primary-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                >
                  {item.label}
                </Link>
              )}
              {current ? null : <ChevronRight aria-hidden="true" className="size-4 text-grey-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
