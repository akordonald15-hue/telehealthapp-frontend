import { ApiError } from "@/lib/api/client";

const messages: Record<string, string> = {
  invalid_code: "This promo code cannot be applied.",
  campaign_unavailable:
    "Founder50 is currently unavailable. Your existing booking is not cancelled.",
  capacity_exhausted: "All 50 Founder50 consultations are currently claimed.",
  benefit_already_claimed:
    "You already have a Founder50 reservation or consultation. Refresh its status below.",
  reservation_expired:
    "Your Founder50 reservation expired. Apply again to check availability.",
  reservation_not_found:
    "This reservation is unavailable for your account. Refresh your status.",
  ineligible_account: "Sign in with an active, email-verified patient account.",
  invalid_request: "Check the promotion fields and try again.",
  invalid_booking:
    "Check your doctor, appointment time and completed care check. Your appointment has not been confirmed.",
  promotion_conflict:
    "The reservation or doctor slot is no longer available for this request. Refresh availability before trying again.",
  idempotency_conflict:
    "This request identity has already been used. Check your appointments before starting another booking.",
  booking_no_longer_confirmed:
    "This appointment already exists. Open your appointments for its current status.",
};
export function promotionCode(error: unknown): string {
  if (!(error instanceof ApiError)) return "";
  const payload = error.payload as Record<string, unknown> | null;
  return typeof payload?.code === "string" ? payload.code : "";
}
export function promotionError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return "Your session expired. Sign in again, then recover your reservation.";
    if (error.status === 403) return messages.ineligible_account;
    if (error.status === 429)
      return "Too many requests. Please wait before trying again.";
    if (messages[promotionCode(error)]) return messages[promotionCode(error)];
    if (error.status === 400) return messages.invalid_request;
  }
  return "We could not confirm the result. Check your connection and retry the same request; do not start another payment.";
}
