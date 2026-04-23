import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
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
    return <div className="rounded-[22px] border border-[#E5E7EB] bg-white p-5 text-sm text-[#667085] shadow-[0_10px_30px_rgba(31,41,55,0.06)]">{loadingLabel}</div>;
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
      <div className="flex flex-col gap-3 rounded-[18px] border border-[#E5E7EB] bg-white px-4 py-3 text-sm text-[#667085] shadow-[0_8px_24px_rgba(31,41,55,0.05)] sm:flex-row sm:items-center sm:justify-between">
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
