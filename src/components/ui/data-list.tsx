import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import type { PaginatedResponse } from "@/lib/types/backend";

export function DataList<T>({
  data,
  error,
  isLoading,
  empty,
  onNext,
  onPrevious,
  renderItem,
}: {
  data?: PaginatedResponse<T>;
  error?: unknown;
  isLoading?: boolean;
  empty: string;
  onNext?: () => void;
  onPrevious?: () => void;
  renderItem: (item: T) => React.ReactNode;
}) {
  if (isLoading) {
    return <div className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">Loading...</div>;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!data || data.results.length === 0) {
    return <div className="rounded-md border border-zinc-200 bg-white p-5 text-sm text-zinc-600">{empty}</div>;
  }

  return (
    <div className="grid gap-3">
      {data.results.map(renderItem)}
      <div className="flex items-center justify-between text-sm text-zinc-500">
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
