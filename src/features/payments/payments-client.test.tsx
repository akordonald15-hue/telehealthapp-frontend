import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Payment } from "@/lib/types/backend";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  list: vi.fn(),
  retry: vi.fn(),
  submitTransfer: vi.fn(),
}));

vi.mock("@/lib/api/endpoints", () => ({
  authApi: { me: mocks.me },
  paymentsApi: { list: mocks.list, retry: mocks.retry, submitTransfer: mocks.submitTransfer },
}));

import { PaymentsClient } from "./payments-client";

function payment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: 31,
    patient: 4,
    appointment: 12,
    homecare_request: null,
    provider: "bank_transfer",
    amount: "5000.00",
    currency: "NGN",
    status: "awaiting_transfer",
    external_ref: "CTK-REF-31",
    provider_reference: "",
    transfer_proof_uploaded: false,
    bank_transfer: {
      bank_name: "Test Bank",
      account_name: "Caretekk Health",
      account_number: "0123456789",
      reference: "CTK-REF-31",
      instructions: "",
    },
    ...overrides,
  } as Payment;
}

function renderWith(results: Payment[]) {
  mocks.list.mockResolvedValue({ count: results.length, next: null, previous: null, results });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <PaymentsClient />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  document.cookie = "caretekk_session=1; Path=/";
  mocks.me.mockResolvedValue({ id: 4, email: "p@caretekk.test", phone: "", full_name: "P", role: "patient", must_change_password: false });
});

afterEach(() => {
  document.cookie = "caretekk_session=; Path=/; Max-Age=0";
  vi.resetAllMocks();
});

describe("Billing History bank transfers", () => {
  it("lets the patient reopen the transfer details and upload proof instead of retrying", async () => {
    mocks.submitTransfer.mockResolvedValue({});
    renderWith([payment()]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Complete bank transfer" }));
    expect(screen.queryByRole("button", { name: "Retry payment" })).not.toBeInTheDocument();

    const details = screen.getByRole("dialog", { name: "Transfer to Caretekk" });
    expect(within(details).getByText("0123456789")).toBeInTheDocument();
    expect(within(details).getAllByText("CTK-REF-31").length).toBeGreaterThan(0);
    await user.click(within(details).getByRole("button", { name: "Close" }));

    const proof = new File(["receipt"], "receipt.png", { type: "image/png" });
    await user.upload(document.querySelector<HTMLInputElement>('input[type="file"]')!, proof);
    await user.click(screen.getByRole("button", { name: "Submit Payment Proof" }));
    await user.click(within(screen.getByRole("dialog", { name: "Confirm payment notification?" })).getByRole("button", { name: "Confirm" }));

    await waitFor(() => expect(mocks.submitTransfer).toHaveBeenCalledTimes(1));
    expect(mocks.submitTransfer.mock.calls[0][0]).toEqual({ paymentId: 31, proofFile: proof });
    expect(mocks.retry).not.toHaveBeenCalled();
  });

  it("offers a rejected transfer another proof upload", async () => {
    renderWith([payment({ status: "rejected" })]);
    expect(await screen.findByRole("button", { name: "Complete bank transfer" })).toBeInTheDocument();
  });

  it("offers no action while a submitted transfer is being verified", async () => {
    renderWith([payment({ status: "awaiting_manual_verification", transfer_proof_uploaded: true })]);
    expect(await screen.findByText(/verifying your transfer/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Complete bank transfer" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Retry payment" })).not.toBeInTheDocument();
  });

  it("still retries card checkouts", async () => {
    mocks.retry.mockResolvedValue({ authorization_url: null });
    renderWith([payment({ provider: "paystack", status: "pending", bank_transfer: null })]);
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "Retry payment" }));

    await waitFor(() => expect(mocks.retry).toHaveBeenCalledWith(31, expect.anything()));
    expect(screen.queryByRole("button", { name: "Complete bank transfer" })).not.toBeInTheDocument();
  });
});
