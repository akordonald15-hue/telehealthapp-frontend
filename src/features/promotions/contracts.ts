import type { AppointmentBookingResponse } from "@/lib/types/backend";

export const founder50Visible =
  process.env.NEXT_PUBLIC_FOUNDER50_ENABLED === "true";
export type Claim = {
  public_id: string;
  status:
    | "reserved"
    | "booked"
    | "redeemed"
    | "expired"
    | "released"
    | "cancelled"
    | "forfeited";
  reserved_at: string;
  expires_at: string;
};
export type Pricing = {
  service_value: string;
  discount: string;
  amount_due: string;
  currency: string;
  promotion_applied: boolean;
  reward_applied: boolean;
  promotion_code: string;
};
export type Reservation = {
  reservation: Claim;
  pricing: Pricing | null;
  applied?: boolean;
  replayed?: boolean;
};
export type Availability = {
  accepting_reservations: boolean;
  eligible: boolean;
  can_reserve: boolean;
  remaining_capacity: number;
  claim: Claim | null;
  code: string;
};
// Deliberately no medical text, tokens, amounts or provider in recovery storage.
export type BookingDraft = {
  doctor: number;
  scheduled_at: string;
  triage_session?: number;
  callback_url: string;
  reason: string;
  notes: string;
  promotion_reservation_id: string;
  idempotency_key: string;
};
export type PromoResult = AppointmentBookingResponse & {
  checkout_type?: string;
  checkout_action?: string;
  payment_required?: boolean;
  booking_status?: string;
  amount_due?: string;
  reservation?: Claim;
};
export function isConfirmed(result: PromoResult) {
  return (
    result.checkout_type === "promotional" &&
    result.checkout_action === "confirmed" &&
    result.payment_required === false &&
    result.booking_status === "confirmed" &&
    result.appointment.status === "confirmed" &&
    result.payment.provider === "promotional" &&
    result.payment.status === "success" &&
    Number(result.payment.amount) === 0 &&
    result.payment.currency === "NGN" &&
    result.amount_due === "0.00"
  );
}
