import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { PaymentInitiation } from "@/lib/types/backend";

import { RepricingConsent } from "./repricing-consent";

function repricedPayment(): PaymentInitiation {
  return {
    payment_id: 1,
    provider: "paystack",
    amount: "2000.00",
    currency: "NGN",
    status: "pending",
    appointment_id: 7,
    homecare_request_id: null,
    authorization_url: "https://paystack.test/checkout",
    external_ref: "ctk.pay.1",
    repriced: true,
    previous_amount: "1500.00",
    pricing: {
      service_value: "2000.00",
      discount: "0.00",
      amount_due: "2000.00",
      currency: "NGN",
      reward_applied: false,
    },
  };
}

describe("repricing consent", () => {
  it("states both amounts and why the reward is gone", () => {
    render(
      <RepricingConsent payment={repricedPayment()} serviceLabel="Consultation" onContinue={() => {}} />,
    );

    expect(screen.getByText(/previous reward is no longer applied/i)).toBeInTheDocument();
    expect(screen.getByText("₦1,500")).toBeInTheDocument();
    expect(screen.getAllByText("₦2,000").length).toBeGreaterThan(0);
    expect(screen.getByText(/back in Refer & Earn/i)).toBeInTheDocument();
  });

  it("does not move the patient on until they explicitly continue", async () => {
    const onContinue = vi.fn();
    render(
      <RepricingConsent payment={repricedPayment()} serviceLabel="Consultation" onContinue={onContinue} />,
    );

    // Nothing has happened just by rendering: no redirect, no side effect.
    expect(onContinue).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("lets the patient back out", async () => {
    const onCancel = vi.fn();
    render(
      <RepricingConsent
        payment={repricedPayment()}
        serviceLabel="Consultation"
        onContinue={() => {}}
        onCancel={onCancel}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /not now/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("announces itself to assistive technology", () => {
    render(
      <RepricingConsent payment={repricedPayment()} serviceLabel="Consultation" onContinue={() => {}} />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
