import { Badge } from "@/components/ui/badge";

export function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const labels: Record<string, string> = {
    accepted: "Accepted",
    arrived: "Arrived",
    assigned: "Assigned",
    awaiting_patient_confirmation: "Awaiting patient",
    cancelled: "Cancelled",
    care_completed: "Care completed",
    care_in_progress: "Care started",
    confirmed: "Confirmed",
    completed: "Completed",
    declined: "Declined",
    draft: "Not yet sent",
    failed: "Failed",
    in_transit: "On the way",
    matching: "Matching",
    patient_confirmed: "Patient confirmed",
    pending: "In review",
    processing: "In progress",
    requested: "Requested",
    scheduled: "Scheduled",
    sent: "Sent",
    unreachable: "Unreachable",
    verification_in_progress: "Verification",
  };
  const label = labels[normalized] ?? value.replace(/_/g, " ");
  const tone =
    normalized.includes("success") ||
    normalized.includes("scheduled") ||
    normalized.includes("completed") ||
    normalized === "patient_confirmed" ||
    normalized === "sent"
      ? "green"
      : normalized.includes("pending") ||
          normalized.includes("processing") ||
          normalized.includes("draft") ||
          normalized === "requested" ||
          normalized === "matching" ||
          normalized === "assigned" ||
          normalized === "verification_in_progress"
        ? "amber"
        : normalized.includes("failed") || normalized.includes("cancelled") || normalized === "unreachable" || normalized === "declined"
          ? "rose"
          : normalized === "confirmed" || normalized === "in_transit" || normalized === "arrived" || normalized === "care_in_progress"
            ? "blue"
            : "neutral";

  return <Badge tone={tone}>{label}</Badge>;
}
