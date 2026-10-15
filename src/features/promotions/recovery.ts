import type { BookingDraft } from "./contracts";

export type Recovery = {
  applyKey?: string;
  booking?: BookingDraft;
  failed?: boolean;
  applyRejected?: boolean;
};
const prefix = "caretekk:founder50:v1:";
export const genericReason = "AI-assisted doctor consultation";
export function readRecovery(userId: number): Recovery {
  const raw = localStorage.getItem(prefix + userId);
  if (!raw) return {};
  const value = JSON.parse(raw) as Recovery;
  const b = value.booking;
  if (
    b &&
    (b.reason !== genericReason ||
      b.notes !== "" ||
      !Number.isInteger(b.doctor) ||
      !b.idempotency_key ||
      !b.promotion_reservation_id ||
      !Number.isFinite(Date.parse(b.scheduled_at)))
  )
    throw new Error("Invalid recovery state");
  return {
    applyKey: value.applyKey,
    failed: value.failed === true || undefined,
    applyRejected: value.applyRejected === true || undefined,
    booking: b
      ? {
          doctor: b.doctor,
          scheduled_at: b.scheduled_at,
          ...(b.triage_session ? { triage_session: b.triage_session } : {}),
          callback_url: b.callback_url,
          reason: genericReason,
          notes: "",
          promotion_reservation_id: b.promotion_reservation_id,
          idempotency_key: b.idempotency_key,
        }
      : undefined,
  };
}
export function saveRecovery(userId: number, value: Recovery) {
  // Only this allowlisted, nonclinical request is persisted. Existing triage stays on the backend.
  localStorage.setItem(prefix + userId, JSON.stringify(value));
}
export function clearRecovery(userId: number) {
  localStorage.removeItem(prefix + userId);
}
export async function accountOperation<T>(
  userId: number,
  operation: () => Promise<T>,
): Promise<T> {
  // Serializes cooperative same-origin tabs; backend constraints remain authoritative.
  if (navigator.locks)
    return navigator.locks.request(prefix + userId, operation);
  return operation();
}
