import { Badge } from "@/components/ui/badge";

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const tone =
    normalized.includes("success") || normalized.includes("scheduled") || normalized.includes("completed")
      ? "green"
      : normalized.includes("pending") || normalized.includes("processing") || normalized.includes("draft")
        ? "amber"
        : normalized.includes("failed") || normalized.includes("cancelled")
          ? "rose"
          : "neutral";

  return <Badge tone={tone}>{value}</Badge>;
}
