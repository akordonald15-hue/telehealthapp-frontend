import { apiRequest } from "@/lib/api/client";
import type {
  Availability,
  BookingDraft,
  PromoResult,
  Reservation,
} from "./contracts";

export const promotionsApi = {
  availability: () =>
    apiRequest<Availability>("/promotions/founder50/", { cache: "no-store" }),
  reserve: (code: string, key: string) =>
    apiRequest<Reservation>("/promotions/founder50/reserve/", {
      method: "POST",
      body: { code, idempotency_key: key, service_type: "appointment" },
    }),
  status: (id: string) =>
    apiRequest<Reservation>(
      `/promotions/reservations/${encodeURIComponent(id)}/`,
      { cache: "no-store" },
    ),
  release: (id: string) =>
    apiRequest<Reservation>(
      `/promotions/reservations/${encodeURIComponent(id)}/release/`,
      { method: "POST", body: {} },
    ),
  book: (body: BookingDraft) =>
    apiRequest<PromoResult>("/appointments/book/", { method: "POST", body }),
};
