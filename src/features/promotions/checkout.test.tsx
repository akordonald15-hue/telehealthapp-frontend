import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/client";
import { promotionsApi } from "./api";
import { isConfirmed, type PromoResult, type Reservation } from "./contracts";
import { promotionError } from "./errors";
import { PromotionCheckout, PromotionConfirmation } from "./promotion-checkout";
import { genericReason, readRecovery, saveRecovery } from "./recovery";
import { useFounder50, type Founder50Controller } from "./use-founder50";

vi.mock("./api", () => ({
  promotionsApi: {
    availability: vi.fn(),
    reserve: vi.fn(),
    status: vi.fn(),
    release: vi.fn(),
    book: vi.fn(),
  },
}));
const claim = {
  public_id: "00000000-0000-4000-8000-000000000001",
  status: "reserved" as const,
  reserved_at: "2026-10-15T12:00:00Z",
  expires_at: "2099-10-16T12:00:00Z",
};
const reservation: Reservation = {
  reservation: claim,
  pricing: {
    service_value: "2450.00",
    discount: "2450.00",
    amount_due: "0.00",
    currency: "NGN",
    promotion_code: "FOUNDER50",
    promotion_applied: true,
    reward_applied: false,
  },
};
const available = {
  accepting_reservations: true,
  eligible: true,
  can_reserve: true,
  remaining_capacity: 50,
  claim: null,
  code: "available",
};
const selection = {
  doctor: 42,
  scheduled_at: "2099-10-22T13:00:00+01:00",
  triage_session: 5,
  callback_url: "https://caretekk.test/appointments",
};
const confirmed = {
  appointment: {
    id: 456,
    doctor: 42,
    doctor_profile: { display_name: "Dr Ada" },
    scheduled_at: selection.scheduled_at,
    status: "confirmed",
  },
  payment: {
    provider: "promotional",
    status: "success",
    amount: "0.00",
    currency: "NGN",
  },
  checkout_type: "promotional",
  checkout_action: "confirmed",
  payment_required: false,
  booking_status: "confirmed",
  amount_due: "0.00",
} as PromoResult;
function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      {children}
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.mocked(promotionsApi.availability).mockResolvedValue(available);
  vi.mocked(promotionsApi.status).mockResolvedValue(reservation);
  vi.mocked(promotionsApi.reserve).mockResolvedValue(reservation);
  vi.mocked(promotionsApi.book).mockResolvedValue(confirmed);
});
async function ready() {
  const hook = renderHook(() => useFounder50(1, true), { wrapper });
  await waitFor(() => expect(hook.result.current.ready).toBe(true));
  await act(() => hook.result.current.apply(" founder50 "));
  // Authoritative availability now includes the reservation.
  return hook;
}
describe("reservation and booking controller", () => {
  it("disabled means no requests, reservations or storage", async () => {
    const { result } = renderHook(() => useFounder50(1, false), { wrapper });
    await act(() => result.current.apply("FOUNDER50"));
    expect(promotionsApi.availability).not.toHaveBeenCalled();
    expect(promotionsApi.reserve).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });
  it("does not apply empty input", async () => {
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await act(() => result.current.apply(" "));
    expect(promotionsApi.reserve).not.toHaveBeenCalled();
  });
  it("applies normalized code without allocation during availability", async () => {
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(promotionsApi.reserve).not.toHaveBeenCalled();
    vi.mocked(promotionsApi.availability).mockResolvedValue({
      ...available,
      claim,
    });
    await act(() => result.current.apply(" founder50 "));
    expect(promotionsApi.reserve).toHaveBeenCalledWith(
      "FOUNDER50",
      expect.any(String),
    );
    expect(result.current.free).toBe(true);
  });
  it("recovers an existing claim without another Apply", async () => {
    vi.mocked(promotionsApi.availability).mockResolvedValue({
      ...available,
      claim,
    });
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.free).toBe(true));
    expect(promotionsApi.reserve).not.toHaveBeenCalled();
  });
  it("prevents duplicate Apply while awaiting response", async () => {
    let resolve!: (r: Reservation) => void;
    vi.mocked(promotionsApi.reserve).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    let first: Promise<unknown>;
    await act(async () => {
      first = result.current.apply("FOUNDER50");
      await Promise.resolve();
    });
    await act(() => result.current.apply("FOUNDER50"));
    expect(promotionsApi.reserve).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve(reservation);
      await first!;
    });
  });
  it("retains ambiguous Apply identity and blocks paid fallback", async () => {
    vi.mocked(promotionsApi.reserve).mockRejectedValue(
      new TypeError("offline"),
    );
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    await act(() => result.current.apply("FOUNDER50"));
    const key = readRecovery(1).applyKey;
    expect(result.current.active).toBe(true);
    await act(() => result.current.apply("FOUNDER50"));
    expect(promotionsApi.reserve).toHaveBeenLastCalledWith("FOUNDER50", key);
  });
  it("uses one nonclinical booking request for double click and lost response recovery", async () => {
    vi.mocked(promotionsApi.availability).mockResolvedValue({
      ...available,
      claim,
    });
    const { result, unmount } = await ready();
    vi.mocked(promotionsApi.book).mockRejectedValueOnce(
      new TypeError("response lost"),
    );
    await act(() => result.current.book(selection));
    const original = readRecovery(1).booking!;
    expect(original.reason).toBe(genericReason);
    expect(original.notes).toBe("");
    expect(result.current.pending).toBeTruthy();
    unmount();
    const recovered = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(recovered.result.current.pending).toBeTruthy());
    await act(() =>
      recovered.result.current.book({ ...selection, doctor: 999 }),
    );
    expect(promotionsApi.book).toHaveBeenCalledTimes(1);
    expect(recovered.result.current.selectionLocked).toBe(true);
    expect(recovered.result.current.result).toBeUndefined();
    await act(() => recovered.result.current.book());
    expect(promotionsApi.book).toHaveBeenLastCalledWith(original);
    expect(recovered.result.current.result?.appointment.id).toBe(456);
    expect(readRecovery(1)).toEqual({});
  });
  it.each([new TypeError("timeout"), new ApiError(500, {}), new ApiError(403, {})])(
    "leaves paid checkout available on optional status failure %s", async (error) => {
      vi.mocked(promotionsApi.availability).mockRejectedValue(error);
      const { result } = renderHook(() => useFounder50(1, true), { wrapper });
      await waitFor(() => expect(result.current.error).toBeTruthy());
      expect(result.current.paidBlocked).toBe(false);
      expect(result.current.active).toBe(false);
      expect(promotionsApi.reserve).not.toHaveBeenCalled();
    },
  );
  it("retains an ambiguous snapshot even when availability fails on reload", async () => {
    saveRecovery(1, { booking: { ...selection, reason: genericReason, notes: "",
      promotion_reservation_id: claim.public_id, idempotency_key: "pending-key" } });
    vi.mocked(promotionsApi.availability).mockRejectedValue(new TypeError("timeout"));
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.selectionLocked).toBe(true);
    expect(result.current.paidBlocked).toBe(true);
    expect(result.current.pending?.doctor).toBe(selection.doctor);
  });
  it("does not wait for a stalled optional availability request to enable clean paid checkout", async () => {
    vi.mocked(promotionsApi.availability).mockImplementation(() => new Promise(() => {}));
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.paidBlocked).toBe(false));
    expect(result.current.ready).toBe(false);
    expect(result.current.pending).toBeUndefined();
  });
  it("does not let a manual status refresh hold the paid-checkout submission lock", async () => {
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    vi.mocked(promotionsApi.availability).mockImplementation(() => new Promise(() => {}));
    act(() => { void result.current.refresh(); });
    expect(result.current.busy).toBe(false);
    expect(result.current.paidBlocked).toBe(false);
  });
  it("checks a newly stored other-tab operation before allowing cash checkout", async () => {
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.canStartPaid()).toBe(true);
    saveRecovery(1, { booking: { ...selection, reason: genericReason, notes: "",
      promotion_reservation_id: claim.public_id, idempotency_key: "other-tab-key" } });
    act(() => { expect(result.current.canStartPaid()).toBe(false); });
    expect(result.current.pending?.idempotency_key).toBe("other-tab-key");
  });
  it.each([
    { ...selection, scheduled_at: "2099-10-23T13:00:00+01:00" },
    { ...selection, triage_session: 99 },
  ])("refuses changed recovery context without mutating the saved operation %s", async (changed) => {
    vi.mocked(promotionsApi.availability).mockResolvedValue({ ...available, claim });
    const { result } = await ready();
    vi.mocked(promotionsApi.book).mockRejectedValueOnce(new TypeError("response lost"));
    await act(() => result.current.book(selection));
    const original = readRecovery(1).booking;
    await act(() => result.current.book(changed));
    expect(promotionsApi.book).toHaveBeenCalledTimes(1);
    expect(readRecovery(1).booking).toEqual(original);
    expect(result.current.selectionLocked).toBe(true);
  });
  it("requires an explicit paid choice after a definite Apply rejection, including refresh", async () => {
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    vi.mocked(promotionsApi.reserve).mockRejectedValue(new ApiError(409, { code: "campaign_unavailable" }));
    await act(() => result.current.apply("FOUNDER50"));
    await act(() => result.current.refresh());
    expect(result.current.paidBlocked).toBe(true);
    act(() => result.current.choosePaid());
    expect(result.current.paidBlocked).toBe(false);
    expect(result.current.active).toBe(false);
    expect(promotionsApi.book).not.toHaveBeenCalled();
  });
  it("does not call a missing URL success", () => {
    expect(isConfirmed({ ...confirmed, checkout_action: undefined })).toBe(
      false,
    );
    expect(
      isConfirmed({
        ...confirmed,
        appointment: { ...confirmed.appointment, status: "pending_payment" },
      }),
    ).toBe(false);
  });
  it("releases unused reservation and refreshes", async () => {
    vi.mocked(promotionsApi.availability).mockResolvedValue({
      ...available,
      claim,
    });
    const { result } = await ready();
    vi.mocked(promotionsApi.release).mockResolvedValue({
      ...reservation,
      reservation: { ...claim, status: "released" },
      pricing: null,
    });
    vi.mocked(promotionsApi.availability).mockResolvedValue(available);
    await act(() => result.current.release());
    expect(promotionsApi.release).toHaveBeenCalledWith(claim.public_id);
    expect(result.current.active).toBe(false);
  });
  it("definitive slot failure permits a new operation", async () => {
    vi.mocked(promotionsApi.availability).mockResolvedValue({
      ...available,
      claim,
    });
    const { result } = await ready();
    vi.mocked(promotionsApi.book).mockRejectedValueOnce(
      new ApiError(400, { code: "invalid_booking" }),
    );
    await act(() => result.current.book(selection));
    const first = vi.mocked(promotionsApi.book).mock.calls[0][0];
    await act(() => result.current.book({ ...selection, doctor: 43 }));
    const second = vi.mocked(promotionsApi.book).mock.calls[1][0];
    expect(second.idempotency_key).not.toBe(first.idempotency_key);
    expect(second.doctor).toBe(43);
  });
  it("retains the same key for unchanged retry after a definite refusal", async () => {
    vi.mocked(promotionsApi.availability).mockResolvedValue({
      ...available,
      claim,
    });
    const { result } = await ready();
    vi.mocked(promotionsApi.book).mockRejectedValueOnce(
      new ApiError(400, { code: "invalid_booking" }),
    );
    await act(() => result.current.book(selection));
    const first = vi.mocked(promotionsApi.book).mock.calls[0][0];
    await act(() => result.current.book(selection));
    expect(promotionsApi.book).toHaveBeenLastCalledWith(first);
  });
  it("serializes two confirm clicks", async () => {
    vi.mocked(promotionsApi.availability).mockResolvedValue({
      ...available,
      claim,
    });
    const { result } = await ready();
    let resolve!: (r: PromoResult) => void;
    vi.mocked(promotionsApi.book).mockImplementation(
      () =>
        new Promise((r) => {
          resolve = r;
        }),
    );
    let first: Promise<unknown>;
    await act(async () => {
      first = result.current.book(selection);
      await Promise.resolve();
    });
    await act(() => result.current.book(selection));
    expect(promotionsApi.book).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve(confirmed);
      await first!;
    });
  });
  it("requires explicit paid choice after expiry and permits paid care after redeemed", async () => {
    const expired = { ...claim, status: "expired" as const };
    vi.mocked(promotionsApi.availability).mockResolvedValue({
      ...available,
      claim: expired,
    });
    vi.mocked(promotionsApi.status).mockResolvedValue({
      reservation: expired,
      pricing: null,
    });
    const { result } = renderHook(() => useFounder50(1, true), { wrapper });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.active).toBe(true);
    act(() => result.current.choosePaid());
    expect(result.current.active).toBe(false);
  });
  it("clears pending replay when appointment has completed without inventing a new appointment", async () => {
    vi.mocked(promotionsApi.availability).mockResolvedValue({
      ...available,
      claim,
    });
    const { result } = await ready();
    vi.mocked(promotionsApi.book).mockRejectedValueOnce(
      new ApiError(409, { code: "booking_no_longer_confirmed" }),
    );
    await act(() => result.current.book(selection));
    expect(result.current.pending).toBeUndefined();
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toMatch(/already exists/);
  });
  it("does not leak recovered identity when account changes", async () => {
    saveRecovery(1, {
      booking: {
        ...selection,
        reason: genericReason,
        notes: "",
        promotion_reservation_id: claim.public_id,
        idempotency_key: "key",
      },
    });
    const { result, rerender } = renderHook(
      ({ id }) => useFounder50(id, true),
      { wrapper, initialProps: { id: 1 } },
    );
    await waitFor(() => expect(result.current.pending).toBeTruthy());
    rerender({ id: 2 });
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.pending).toBeUndefined();
  });
});
const controller = (changes: Partial<Founder50Controller> = {}) =>
  ({
    enabled: true,
    ready: true,
    busy: false,
    error: "",
    active: false,
    free: false,
    apply: vi.fn(),
    release: vi.fn(),
    book: vi.fn(),
    refresh: vi.fn(),
    ...changes,
  }) as unknown as Founder50Controller;
describe("accessible promotion display", () => {
  it("hides all campaign UI when disabled", () => {
    const { container } = render(
      <PromotionCheckout promotion={controller({ enabled: false })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
  it("supports labelled keyboard Apply and no typing reservation", async () => {
    const p = controller();
    render(<PromotionCheckout promotion={p} />);
    const input = screen.getByLabelText("Promo code");
    await userEvent.type(input, "FOUNDER50");
    expect(p.apply).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(p.apply).toHaveBeenCalledWith("FOUNDER50");
  });
  it("shows authoritative pricing and a removable reservation", () => {
    render(
      <PromotionCheckout promotion={controller({ free: true, reservation })} />,
    );
    expect(screen.getAllByText(/2,450/)).toHaveLength(2);
    expect(screen.getByText("Total to pay")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Remove promotion" }),
    ).toBeEnabled();
  });
  it("shows expired and exhausted states", () => {
    render(
      <PromotionCheckout
        promotion={controller({
          reservation: {
            reservation: { ...claim, status: "expired" },
            pricing: null,
          },
          availability: { ...available, code: "capacity_exhausted" },
        })}
      />,
    );
    expect(screen.getByText(/reservation expired/)).toBeVisible();
    expect(screen.getByText(/All 50/)).toBeVisible();
  });
  it("does not count down a booked future consultation", () => {
    render(
      <PromotionCheckout
        promotion={controller({
          reservation: {
            reservation: { ...claim, status: "booked" },
            pricing: null,
          },
        })}
      />,
    );
    expect(
      screen.getByText(/not subject to the reservation countdown/),
    ).toBeVisible();
    expect(screen.queryByText(/remaining to confirm/)).not.toBeInTheDocument();
  });
  it("reconciles elapsed browser countdown with backend", async () => {
    const p = controller({
      free: true,
      reservation: {
        ...reservation,
        reservation: { ...claim, expires_at: "2020-01-01T00:00:00Z" },
      },
    });
    render(<PromotionCheckout promotion={p} />);
    await waitFor(() => expect(p.refresh).toHaveBeenCalledTimes(1));
  });
  it("confirms doctor, time, zero cash and detail navigation", () => {
    render(
      <PromotionConfirmation promotion={controller({ result: confirmed })} />,
    );
    expect(screen.getByText(/Dr Ada/)).toBeVisible();
    expect(screen.getByText(/Amount paid: ₦0/)).toBeVisible();
    expect(screen.getByRole("link")).toHaveAttribute(
      "href",
      "/appointments/456",
    );
  });
  it.each([
    "invalid_code",
    "capacity_exhausted",
    "ineligible_account",
    "reservation_expired",
    "promotion_conflict",
    "booking_no_longer_confirmed",
  ])("has safe copy for %s", (code) => {
    expect(
      promotionError(new ApiError(409, { code, detail: "SECRET SQL" })),
    ).not.toContain("SECRET");
  });
  it.each([401, 403, 429, 500])("safe framework error %i", (status) => {
    expect(
      promotionError(new ApiError(status, { detail: "SECRET SQL" })),
    ).not.toContain("SECRET");
  });
});
