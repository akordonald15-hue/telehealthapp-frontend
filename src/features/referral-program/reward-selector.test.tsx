import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import type { MyReferralReward } from "@/lib/types/backend";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  referrals: vi.fn(),
  rewards: vi.fn(),
  attach: vi.fn(),
  previewReward: vi.fn(),
}));

vi.mock("@/lib/api/endpoints", () => ({ referralProgramApi: mocks }));

import { PricingBreakdown, RewardSelector } from "./reward-selector";
import { requiresRepricingConsent } from "./repricing-consent";

function reward(overrides: Partial<MyReferralReward> = {}): MyReferralReward {
  return {
    public_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    status: "issued",
    reward_type: "percent",
    reward_value: "25.00",
    max_reward_amount: "3000.00",
    applicable_services: ["appointment", "homecare"],
    issued_at: "2026-09-24T10:00:00Z",
    expires_at: "2026-11-23T10:00:00Z",
    used_at: null,
    is_redeemable: true,
    ...overrides,
  };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mocks.rewards.mockResolvedValue({ count: 1, next: null, previous: null, results: [reward()] });
  mocks.previewReward.mockResolvedValue({
    service_value: "2000.00",
    discount: "500.00",
    amount_due: "1500.00",
    currency: "NGN",
    reward_applied: true,
    service_type: "appointment",
    binding: false,
  });
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("reward selection during booking", () => {
  it("offers an eligible reward using the server's own values", async () => {
    render(<RewardSelector serviceType="appointment" selectedRewardId={null} onSelect={() => {}} />, { wrapper });

    expect(await screen.findByText(/25% off · Up to ₦3,000/)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /25% off/ })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /don't use a reward/i })).toBeInTheDocument();
  });

  it("reports the selected reward by public id and nothing else", async () => {
    const onSelect = vi.fn();
    render(<RewardSelector serviceType="appointment" selectedRewardId={null} onSelect={onSelect} />, { wrapper });

    await userEvent.click(await screen.findByRole("radio", { name: /25% off/ }));

    expect(onSelect).toHaveBeenCalledWith("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    // No amount, percent or final price is ever emitted by the selector.
    expect(onSelect.mock.calls.flat()).toEqual(["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]);
  });

  it("shows the server's non-binding preview once a reward is chosen", async () => {
    render(
      <RewardSelector
        serviceType="appointment"
        serviceLabel="Consultation"
        selectedRewardId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        onSelect={() => {}}
      />,
      { wrapper },
    );

    // TanStack v5 passes a context object as a second argument, so assert the variables only.
    await waitFor(() => expect(mocks.previewReward).toHaveBeenCalled());
    expect(mocks.previewReward.mock.calls[0][0]).toEqual({
      publicId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      serviceType: "appointment",
    });
    expect(await screen.findByText("₦1,500")).toBeInTheDocument();
    expect(screen.getByText("-₦500")).toBeInTheDocument();
    // Explicitly non-binding.
    expect(screen.getByText(/Final price is confirmed when you continue to payment/i)).toBeInTheDocument();
  });

  it("prices the chosen home-care service, not a guess", async () => {
    render(
      <RewardSelector
        serviceType="homecare"
        serviceId={42}
        selectedRewardId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        onSelect={() => {}}
      />,
      { wrapper },
    );

    await waitFor(() => expect(mocks.previewReward).toHaveBeenCalled());
    expect(mocks.previewReward.mock.calls[0][0]).toEqual({
      publicId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      serviceType: "homecare",
      service: 42,
    });
  });

  it("hides itself when a reward is not eligible for this service", async () => {
    mocks.rewards.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [reward({ applicable_services: ["homecare"] })],
    });

    const { container } = render(
      <RewardSelector serviceType="appointment" selectedRewardId={null} onSelect={() => {}} />,
      { wrapper },
    );

    await waitFor(() => expect(mocks.rewards).toHaveBeenCalled());
    await waitFor(() => expect(container.querySelector("fieldset")).toBeNull());
  });

  it("stays out of the way entirely when the programme is unavailable", async () => {
    mocks.rewards.mockRejectedValue(
      new ApiError(503, { error: "service_unavailable", message: "We couldn't reach the care service right now." } as never),
    );

    const { container } = render(
      <RewardSelector serviceType="appointment" selectedRewardId={null} onSelect={() => {}} />,
      { wrapper },
    );

    await waitFor(() => expect(container.querySelector("fieldset")).toBeNull());
  });

  it("drops a selection the server no longer offers", async () => {
    const onSelect = vi.fn();
    mocks.rewards.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });

    render(
      <RewardSelector serviceType="appointment" selectedRewardId="gone" onSelect={onSelect} />,
      { wrapper },
    );

    await waitFor(() => expect(onSelect).toHaveBeenCalledWith(null));
  });

  it("surfaces a refused preview without blocking the booking", async () => {
    mocks.previewReward.mockRejectedValue(new ApiError(400, { detail: "This reward cannot be used." } as never));

    render(
      <RewardSelector
        serviceType="appointment"
        selectedRewardId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
        onSelect={() => {}}
      />,
      { wrapper },
    );

    expect(await screen.findByText(/can't be previewed right now/i)).toBeInTheDocument();
  });
});

describe("pricing breakdown", () => {
  it("renders exactly what the server returned, with no recalculation", () => {
    render(
      <PricingBreakdown
        serviceLabel="Consultation"
        pricing={{
          service_value: "2000.00",
          discount: "500.00",
          amount_due: "1500.00",
          currency: "NGN",
          reward_applied: true,
        }}
      />,
    );

    expect(screen.getByText("Consultation")).toBeInTheDocument();
    expect(screen.getByText("₦2,000")).toBeInTheDocument();
    expect(screen.getByText("-₦500")).toBeInTheDocument();
    expect(screen.getByText("₦1,500")).toBeInTheDocument();
  });

  it("omits the discount line for an ordinary booking", () => {
    render(
      <PricingBreakdown
        serviceLabel="Consultation"
        pricing={{
          service_value: "2000.00",
          discount: "0.00",
          amount_due: "2000.00",
          currency: "NGN",
          reward_applied: false,
        }}
      />,
    );

    expect(screen.queryByText(/referral reward/i)).not.toBeInTheDocument();
    // The service value and the amount due are both ₦2,000 when nothing is discounted.
    expect(screen.getAllByText("₦2,000")).toHaveLength(2);
  });
});

describe("repricing detection", () => {
  it("requires consent only when the server says the checkout was repriced", () => {
    expect(requiresRepricingConsent({ repriced: true } as never)).toBe(true);
    expect(requiresRepricingConsent({ repriced: false } as never)).toBe(false);
    expect(requiresRepricingConsent(null)).toBe(false);
    expect(requiresRepricingConsent(undefined)).toBe(false);
  });
});
