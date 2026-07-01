import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { InlineLoader } from "@/components/ui/loaders";
import type { PaginatedResponse } from "@/lib/types/backend";

export function DataList<T>({
  data,
  error,
  isLoading,
  empty,
  emptyTitle = "Nothing here yet",
  loadingLabel = "Loading...",
  errorContext = "generic",
  onNext,
  onPrevious,
  renderItem,
  emptyAction,
}: {
  data?: PaginatedResponse<T>;
  error?: unknown;
  isLoading?: boolean;
  empty: string;
  emptyTitle?: string;
  loadingLabel?: string;
  errorContext?:
    | "generic"
    | "auth"
    | "dashboard"
    | "appointments"
    | "messages"
    | "messageSend"
    | "payments"
    | "paymentCheckout"
    | "records"
    | "recordUpload"
    | "referrals"
    | "triage"
    | "profile";
  emptyAction?: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="grid gap-3" aria-label={loadingLabel} aria-busy="true">
        <InlineLoader label={loadingLabel} />
        {[0, 1, 2].map((item) => (
          <div key={item} className="ct-surface rounded-[8px] p-5">
            <div className="h-4 w-32 animate-pulse rounded-full bg-ash-100" />
            <div className="mt-4 h-5 w-3/5 animate-pulse rounded-full bg-ash-100" />
            <div className="mt-3 h-3 w-4/5 animate-pulse rounded-full bg-ash-100" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} context={errorContext} />;
  }

  if (!data || data.results.length === 0) {
    return <EmptyState title={emptyTitle} description={empty} action={emptyAction} />;
  }

  return (
    <div className="grid gap-3">
      {data.results.map(renderItem)}
      <div className="ct-surface flex flex-col gap-3 rounded-[8px] px-4 py-3 text-sm text-ash-500 sm:flex-row sm:items-center sm:justify-between">
        <span>{typeof data.count === "number" ? `${data.count} total` : "More results may be available"}</span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={!data.previous || !onPrevious} onClick={onPrevious} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" disabled={!data.next || !onNext} onClick={onNext} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
