import type {
  HomeCareRequestDetail,
  HomeCareRequestEvent,
  HomeCareRequestListItem,
  HomeCareRequestStatus,
} from "@/lib/types/backend";

const statusLabels: Record<string, string> = {
  requested: "Request received",
  matching: "Finding a nurse",
  assigned: "Nurse assigned",
  accepted: "Nurse accepted",
  verification_in_progress: "Pre-visit check",
  confirmed: "Visit confirmed",
  in_transit: "Nurse on the way",
  arrived: "Nurse arrived",
  care_in_progress: "Care in progress",
  care_completed: "Care completed",
  patient_confirmed: "Completion confirmed",
  awaiting_patient_confirmation: "Needs clarification",
  unreachable: "Patient unreachable",
  cancelled: "Cancelled",
  match_failed: "No nurse available yet",
  pending: "Pending",
  completed: "Completed",
};

export const homeCareTimeline: Array<{ status: HomeCareRequestStatus; label: string }> = [
  { status: "requested", label: "Requested" },
  { status: "assigned", label: "Assigned" },
  { status: "accepted", label: "Accepted" },
  { status: "confirmed", label: "Verified" },
  { status: "in_transit", label: "On the way" },
  { status: "arrived", label: "Arrived" },
  { status: "care_in_progress", label: "Care started" },
  { status: "care_completed", label: "Completed" },
  { status: "patient_confirmed", label: "Confirmed" },
];

const timelineOrder: HomeCareRequestStatus[] = [
  "requested",
  "matching",
  "assigned",
  "accepted",
  "verification_in_progress",
  "confirmed",
  "in_transit",
  "arrived",
  "care_in_progress",
  "care_completed",
  "patient_confirmed",
];

export function homeCareStatusLabel(value: string) {
  return statusLabels[value] ?? value.replace(/_/g, " ");
}

export function bookingSourceLabel(value: string) {
  return value === "doctor_referral" ? "Doctor referral" : "Direct";
}

export function preferredTimeLabel(request: HomeCareRequestListItem | HomeCareRequestDetail) {
  if (!request.requested_window_start && !request.requested_window_end) {
    return "Flexible time";
  }

  if (request.requested_window_start && request.requested_window_end) {
    return `${new Date(request.requested_window_start).toLocaleString()} - ${new Date(
      request.requested_window_end,
    ).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }

  return new Date(request.requested_window_start || request.requested_window_end || "").toLocaleString();
}

export function canCancelHomeCare(status?: HomeCareRequestStatus) {
  return Boolean(
    status &&
      ![
        "in_transit",
        "arrived",
        "care_in_progress",
        "care_completed",
        "patient_confirmed",
        "cancelled",
        "unreachable",
      ].includes(status),
  );
}

export function canConfirmHomeCare(status?: HomeCareRequestStatus) {
  return status === "care_completed";
}

export function canRateHomeCare(status?: HomeCareRequestStatus) {
  return status === "patient_confirmed";
}

export function statusStepState(step: HomeCareRequestStatus, current: HomeCareRequestStatus) {
  if (["cancelled", "unreachable", "match_failed", "awaiting_patient_confirmation"].includes(current)) {
    return step === current ? "current" : "pending";
  }

  const stepIndex = timelineOrder.indexOf(step);
  const currentIndex = timelineOrder.indexOf(current);
  if (stepIndex === -1 || currentIndex === -1) {
    return "pending";
  }
  if (stepIndex < currentIndex) {
    return "done";
  }
  if (stepIndex === currentIndex) {
    return "current";
  }
  return "pending";
}

export function eventSummary(event: HomeCareRequestEvent) {
  return homeCareStatusLabel(event.to_status || event.event_type.replace(/^homecare_/, ""));
}

export function referralNotes(request?: HomeCareRequestDetail | null) {
  const snapshot = request?.source_snapshot;
  if (!snapshot || typeof snapshot !== "object") {
    return "";
  }
  const notes = snapshot.notes;
  return typeof notes === "string" ? notes : "";
}
