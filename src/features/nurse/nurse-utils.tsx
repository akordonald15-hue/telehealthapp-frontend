import type {
  HomeCareAssignment,
  HomeCareRequestDetail,
  HomeCareRequestEvent,
  HomeCareRequestListItem,
  HomeCareRequestStatus,
} from "@/lib/types/backend";

export const verificationOutcomeOptions = [
  { value: "confirmed", label: "Confirmed", description: "Patient details are confirmed and travel can begin." },
  { value: "no_answer", label: "No answer", description: "The patient could not be reached right now." },
  { value: "wrong_number", label: "Wrong number", description: "The saved number does not reach the patient." },
  { value: "address_unclear", label: "Address unclear", description: "The location needs more detail before travel." },
  { value: "reschedule_requested", label: "Reschedule requested", description: "The patient asked to move the visit." },
  { value: "patient_cancelled", label: "Patient cancelled", description: "The patient no longer needs the visit." },
] as const;

export type VerificationOutcomeOption = (typeof verificationOutcomeOptions)[number]["value"];

const statusLabels: Record<string, string> = {
  requested: "Pending match",
  matching: "Matching",
  assigned: "Assigned",
  accepted: "Accepted",
  verification_in_progress: "Pre-visit confirmation",
  confirmed: "Confirmed for travel",
  in_transit: "On the way",
  arrived: "Arrived",
  care_in_progress: "Care started",
  care_completed: "Care completed",
  patient_confirmed: "Patient confirmed",
  awaiting_patient_confirmation: "Awaiting patient confirmation",
  unreachable: "Patient unreachable",
  cancelled: "Cancelled",
  match_failed: "Pending match",
  pending: "Pending offer",
  declined: "Declined",
  reassigned: "Reassigned",
  completed: "Completed",
};

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
    return `${new Date(request.requested_window_start).toLocaleString()} - ${new Date(request.requested_window_end).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  }
  return new Date(request.requested_window_start || request.requested_window_end || "").toLocaleString();
}

export function requestDistanceLabel(request: HomeCareRequestDetail | HomeCareRequestListItem) {
  const distance = request.current_assignment && "match_score" in request.current_assignment ? request.current_assignment.match_score : undefined;
  return distance ? `${distance} match score` : "Distance not available yet";
}

export function isHistoryRequest(status: HomeCareRequestStatus) {
  return ["care_completed", "patient_confirmed", "cancelled", "unreachable"].includes(status);
}

export function activeAssignmentForRequest(request?: HomeCareRequestListItem | HomeCareRequestDetail | null) {
  return request?.current_assignment ?? null;
}

export function canAcceptAssignment(assignment: HomeCareAssignment, request?: HomeCareRequestListItem | HomeCareRequestDetail | null) {
  return assignment.is_current && assignment.status === "pending" && request?.status === "assigned";
}

export function canDeclineAssignment(assignment: HomeCareAssignment, request?: HomeCareRequestListItem | HomeCareRequestDetail | null) {
  return assignment.is_current && assignment.status === "pending" && request?.status === "assigned";
}

export function canVerifyRequest(assignment: HomeCareAssignment, request?: HomeCareRequestDetail | null) {
  return assignment.is_current && assignment.status === "accepted" && ["accepted", "verification_in_progress"].includes(request?.status ?? "");
}

export function canStartTrip(assignment: HomeCareAssignment, request?: HomeCareRequestDetail | null) {
  return assignment.is_current && assignment.status === "accepted" && request?.status === "confirmed";
}

export function canMarkArrived(assignment: HomeCareAssignment, request?: HomeCareRequestDetail | null) {
  return assignment.is_current && assignment.status === "accepted" && request?.status === "in_transit";
}

export function canStartCare(assignment: HomeCareAssignment, request?: HomeCareRequestDetail | null) {
  return assignment.is_current && assignment.status === "accepted" && request?.status === "arrived";
}

export function canCompleteCare(assignment: HomeCareAssignment, request?: HomeCareRequestDetail | null) {
  return assignment.is_current && assignment.status === "accepted" && request?.status === "care_in_progress";
}

export function buildVerificationPayload(selection: VerificationOutcomeOption, notes: string) {
  const trimmedNotes = notes.trim();

  switch (selection) {
    case "confirmed":
      return {
        patient_is_real: true,
        phone_number_active: true,
        address_is_clear: true,
        patient_available: true,
        request_still_valid: true,
        outcome: "confirmed" as const,
        notes: trimmedNotes,
      };
    case "no_answer":
      return {
        patient_is_real: false,
        phone_number_active: false,
        address_is_clear: true,
        patient_available: false,
        request_still_valid: true,
        outcome: "no_answer" as const,
        notes: trimmedNotes || "Patient did not answer the pre-visit confirmation call.",
      };
    case "wrong_number":
      return {
        patient_is_real: false,
        phone_number_active: false,
        address_is_clear: true,
        patient_available: false,
        request_still_valid: true,
        outcome: "needs_clarification" as const,
        notes: trimmedNotes || "Wrong number reported during pre-visit confirmation.",
      };
    case "address_unclear":
      return {
        patient_is_real: true,
        phone_number_active: true,
        address_is_clear: false,
        patient_available: true,
        request_still_valid: true,
        outcome: "needs_clarification" as const,
        notes: trimmedNotes || "Address details need clarification before travel.",
      };
    case "reschedule_requested":
      return {
        patient_is_real: true,
        phone_number_active: true,
        address_is_clear: true,
        patient_available: false,
        request_still_valid: true,
        outcome: "needs_clarification" as const,
        notes: trimmedNotes || "Patient requested a reschedule during pre-visit confirmation.",
      };
    case "patient_cancelled":
      return {
        patient_is_real: true,
        phone_number_active: true,
        address_is_clear: true,
        patient_available: false,
        request_still_valid: false,
        outcome: "request_cancelled" as const,
        notes: trimmedNotes || "Patient cancelled the request during pre-visit confirmation.",
      };
  }
}

export function recentActivitySummary(event: HomeCareRequestEvent) {
  return homeCareStatusLabel(event.to_status || event.event_type.replace(/^homecare_/, ""));
}
