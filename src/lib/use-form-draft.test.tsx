import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useFormDraft } from "./use-form-draft";

type Payment = { payment_id: number; provider: string; bank_transfer: { account_number: string } | null };

const KEY = "caretekk:draft:bank-transfer:consultation:7";
const payment: Payment = { payment_id: 55, provider: "bank_transfer", bank_transfer: { account_number: "0123456789" } };

// Mirrors the booking pages: saving needs a payment, so restoring must not.
function usePaymentDraft(restoreEnabled?: boolean) {
  const [manualPayment, setManualPayment] = useState<Payment | null>(null);
  const draft = useFormDraft<Payment | null>({
    key: KEY,
    value: manualPayment,
    enabled: Boolean(manualPayment),
    restoreEnabled,
    debounceMs: 0,
    expiresInMs: 2 * 60 * 60 * 1000,
    onRestore: (saved) => setManualPayment(saved),
    isSignificant: (saved) => Boolean(saved?.provider === "bank_transfer" && saved.bank_transfer),
  });
  return { manualPayment, setManualPayment, draft };
}

async function flushSave() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

afterEach(() => {
  window.localStorage.clear();
  vi.useRealTimers();
});

describe("bank-transfer payment draft", () => {
  it("brings the transfer details back after the page reloads", async () => {
    const first = renderHook(() => usePaymentDraft(true));
    act(() => {
      // The booking pages clear any older draft before showing the new payment.
      first.result.current.draft.clearDraft();
      first.result.current.setManualPayment(payment);
    });
    await flushSave();
    expect(window.localStorage.getItem(KEY)).toContain("0123456789");
    first.unmount();

    const reloaded = renderHook(() => usePaymentDraft(true));

    expect(reloaded.result.current.manualPayment).toEqual(payment);
    expect(reloaded.result.current.draft.restored).toBe(true);
  });

  it("keeps the old behaviour when restore is not separately enabled", async () => {
    const first = renderHook(() => usePaymentDraft());
    act(() => first.result.current.setManualPayment(payment));
    await flushSave();
    first.unmount();

    const reloaded = renderHook(() => usePaymentDraft());

    expect(reloaded.result.current.manualPayment).toBeNull();
  });

  it("does not restore a cleared or expired payment", async () => {
    const first = renderHook(() => usePaymentDraft(true));
    act(() => first.result.current.setManualPayment(payment));
    await flushSave();
    act(() => first.result.current.draft.clearDraft());
    first.unmount();
    expect(renderHook(() => usePaymentDraft(true)).result.current.manualPayment).toBeNull();

    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, expiresAt: Date.now() - 1, data: payment }));
    expect(renderHook(() => usePaymentDraft(true)).result.current.manualPayment).toBeNull();
    expect(window.localStorage.getItem(KEY)).toBeNull();
  });
});
