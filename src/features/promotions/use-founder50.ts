"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { promotionsApi } from "./api";
import {
  founder50Visible,
  isConfirmed,
  type Availability,
  type BookingDraft,
  type PromoResult,
  type Reservation,
} from "./contracts";
import { promotionCode, promotionError } from "./errors";
import {
  accountOperation,
  clearRecovery,
  genericReason,
  readRecovery,
  saveRecovery,
} from "./recovery";

export function useFounder50(userId?: number, enabled = founder50Visible) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<{
    owner?: number;
    availability?: Availability;
    reservation?: Reservation;
    result?: PromoResult;
    pending?: BookingDraft;
    intent?: boolean;
    paidChosen?: boolean;
    busy: boolean;
    error: string;
    ready: boolean;
  }>({ busy: false, error: "", ready: false });
  const currentUser = useRef(userId);
  useEffect(() => {
    currentUser.current = userId;
  }, [userId]);
  const running = useRef(false);
  const update = useCallback(
    (values: Partial<typeof state>) => {
      if (currentUser.current === userId)
        setState((s) => ({
          ...(s.owner === userId
            ? s
            : { busy: false, error: "", ready: false }),
          ...values,
          owner: userId,
        }));
    },
    [userId],
  );
  const refresh = useCallback(async () => {
    if (!enabled || !userId) return;
    const recovery = readRecovery(userId);
    const availability = await promotionsApi.availability();
    const reservation = availability.claim
      ? await promotionsApi.status(availability.claim.public_id)
      : undefined;
    if (
      (!recovery.booking || recovery.failed) &&
      reservation &&
      ["expired", "released"].includes(reservation.reservation.status)
    )
      clearRecovery(userId);
    update({
      availability,
      reservation,
      pending: recovery.failed ? undefined : recovery.booking,
      intent: Boolean(recovery.applyKey && !reservation && !recovery.booking),
      ready: true,
    });
  }, [enabled, userId, update]);
  useEffect(() => {
    if (!enabled || !userId) return;
    let active = true;
    const reconcile = () => {
      if (active)
        void refresh().catch((e) =>
          update({ error: promotionError(e), ready: false }),
        );
    };
    reconcile();
    window.addEventListener("focus", reconcile);
    window.addEventListener("storage", reconcile);
    return () => {
      active = false;
      window.removeEventListener("focus", reconcile);
      window.removeEventListener("storage", reconcile);
    };
  }, [enabled, userId, refresh, update]);
  const run = async <T>(
    operation: () => Promise<T>,
  ): Promise<T | undefined> => {
    if (!enabled || !userId || running.current) return;
    running.current = true;
    update({ busy: true, error: "" });
    try {
      return await accountOperation(userId, operation);
    } catch (e) {
      update({ error: promotionError(e) });
    } finally {
      running.current = false;
      update({ busy: false });
    }
  };
  async function apply(code: string) {
    return run(async () => {
      if (!code.trim()) {
        update({ error: "Enter a promo code." });
        return;
      }
      const saved = readRecovery(userId!);
      if (saved.booking) {
        update({
          pending: saved.booking,
          error: "Recover your previous booking request first.",
        });
        return;
      }
      const key = saved.applyKey || crypto.randomUUID();
      saveRecovery(userId!, { applyKey: key });
      update({ intent: true, paidChosen: false });
      try {
        const reservation = await promotionsApi.reserve(
          code.trim().toUpperCase(),
          key,
        );
        update({ reservation });
        if (reservation.reservation.status !== "reserved")
          clearRecovery(userId!);
        await refresh();
      } catch (e) {
        // An invalid code did not bind an operation. Ambiguous network outcomes retain the key.
        if (
          e instanceof ApiError &&
          e.status >= 400 &&
          e.status < 500 &&
          e.status !== 408 &&
          e.status !== 429
        ) {
          clearRecovery(userId!);
          update({ intent: false });
        }
        throw e;
      }
    });
  }
  async function release() {
    return run(async () => {
      const recovery = readRecovery(userId!);
      if (recovery.booking && !recovery.failed)
        throw new Error("Recover the pending booking first");
      const claim =
        state.owner === userId ? state.reservation?.reservation : undefined;
      if (!claim) return;
      await promotionsApi.release(claim.public_id);
      clearRecovery(userId!);
      update({ reservation: undefined, intent: false });
      await refresh();
    });
  }
  async function book(
    selection?: Pick<
      BookingDraft,
      "doctor" | "scheduled_at" | "triage_session" | "callback_url"
    >,
  ) {
    return run(async () => {
      const saved = readRecovery(userId!);
      let body = saved.booking;
      if (saved.failed && selection && body) {
        const unchanged =
          body.doctor === selection.doctor &&
          new Date(body.scheduled_at).toISOString() ===
            new Date(selection.scheduled_at).toISOString() &&
          body.triage_session === selection.triage_session &&
          body.callback_url === selection.callback_url;
        if (!unchanged) body = undefined;
      }
      if (!body) {
        const id =
          state.owner === userId
            ? state.reservation?.reservation.public_id
            : undefined;
        if (
          !selection ||
          !id ||
          state.reservation?.reservation.status !== "reserved"
        )
          throw new Error("Refresh your reservation");
        body = {
          ...selection,
          scheduled_at: new Date(selection.scheduled_at).toISOString(),
          reason: genericReason,
          notes: "",
          promotion_reservation_id: id,
          idempotency_key: crypto.randomUUID(),
        };
      }
      saveRecovery(userId!, { ...saved, booking: body, failed: false });
      // Always recover the exact persisted operation before considering changed UI input.
      update({ pending: body });
      try {
        const result = await promotionsApi.book(body);
        if (!isConfirmed(result)) throw new Error("Unconfirmed response");
        clearRecovery(userId!);
        update({
          result,
          pending: undefined,
          reservation: undefined,
          intent: false,
        });
        void queryClient.invalidateQueries({ queryKey: ["appointments"] });
        void queryClient.invalidateQueries({ queryKey: ["payments"] });
        return result;
      } catch (e) {
        const code = promotionCode(e);
        if (
          e instanceof ApiError &&
          (e.status === 400 ||
            [
              "reservation_expired",
              "promotion_conflict",
              "reservation_not_found",
            ].includes(code))
        ) {
          saveRecovery(userId!, {
            applyKey: saved.applyKey,
            booking: body,
            failed: true,
          });
          update({ pending: undefined });
        }
        // Already-existing bookings or an unknown result never fall through to paid checkout.
        if (code === "booking_no_longer_confirmed") {
          clearRecovery(userId!);
          update({ pending: undefined });
        }
        await refresh().catch(() => undefined);
        throw e;
      }
    });
  }
  const own = state.owner === userId;
  const reservation = own ? state.reservation : undefined;
  const claim = reservation?.reservation;
  const occupied =
    claim?.status === "reserved" ||
    claim?.status === "booked" ||
    claim?.status === "redeemed" ||
    claim?.status === "forfeited";
  const expiredNeedsChoice = claim?.status === "expired" && !state.paidChosen;
  return {
    enabled: enabled && Boolean(userId),
    ...state,
    ...(own
      ? {}
      : {
          availability: undefined,
          reservation: undefined,
          result: undefined,
          pending: undefined,
          ready: false,
          error: "",
        }),
    active:
      enabled &&
      Boolean(
        (occupied && !state.paidChosen) ||
        expiredNeedsChoice ||
        (own && (state.pending || state.intent)),
      ),
    free:
      enabled &&
      !state.paidChosen &&
      claim?.status === "reserved" &&
      Boolean(reservation?.pricing),
    choosePaid: () => {
      if (claim?.status !== "reserved" && !state.pending && !state.intent)
        update({ paidChosen: true });
    },
    apply,
    release,
    book,
    refresh: () => run(refresh),
  };
}
export type Founder50Controller = ReturnType<typeof useFounder50>;
