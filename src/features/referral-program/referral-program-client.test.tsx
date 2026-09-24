import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/client";
import type { MyReferral, MyReferralCode, MyReferralReward } from "@/lib/types/backend";

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  referrals: vi.fn(),
  rewards: vi.fn(),
  attach: vi.fn(),
  previewReward: vi.fn(),
}));

vi.mock("@/lib/api/endpoints", () => ({ referralProgramApi: mocks }));

import { ReferralProgramClient } from "./referral-program-client";

const PROGRAMME: MyReferralCode = {
  code: "DONALD7K3Q",
  is_active: true,
  share_url: "https://caretekk.com/r/DONALD7K3Q",
  share_text: "Use my code DONALD7K3Q when you book: https://caretekk.com/r/DONALD7K3Q",
  programme: {
    reward_type: "percent",
    reward_value: "25.00",
    max_reward_amount: "3000.00",
    reward_expiry_days: 60,
    min_qualifying_paid_amount: "1000.00",
    qualification_hold_days: 7,
    qualifying_service_types: ["appointment", "homecare"],
  },
};

function reward(overrides: Partial<MyReferralReward> = {}): MyReferralReward {
  return {
    public_id: "11111111-1111-1111-1111-111111111111",
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

function referral(overrides: Partial<MyReferral> = {}): MyReferral {
  return {
    public_id: "22222222-2222-2222-2222-222222222222",
    status: "pending",
    attached_at: "2026-09-20T10:00:00Z",
    qualifies_at: null,
    qualified_at: null,
    reward: null,
    ...overrides,
  };
}

function page(results: unknown[]) {
  return { count: results.length, next: null, previous: null, results };
}

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  mocks.me.mockResolvedValue(PROGRAMME);
  mocks.referrals.mockResolvedValue(page([]));
  mocks.rewards.mockResolvedValue(page([]));
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("Refer & Earn", () => {
  it("renders the code, share link and the programme terms the backend returned", async () => {
    render(<ReferralProgramClient />, { wrapper });

    expect(await screen.findByTestId("referral-code")).toHaveTextContent("DONALD7K3Q");
    expect(screen.getByText("https://caretekk.com/r/DONALD7K3Q")).toBeInTheDocument();
    // Terms come from the response, not from hard-coded copy.
    expect(screen.getByText(/25% off/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum discount ₦3,000/i)).toBeInTheDocument();
    expect(screen.getByText(/at least ₦1,000/i)).toBeInTheDocument();
    expect(screen.getByText(/7 days after their service/i)).toBeInTheDocument();
  });

  it("offers copy and WhatsApp sharing", async () => {
    render(<ReferralProgramClient />, { wrapper });

    // Wait for the card itself, then assert its controls, so a slow query cannot look like a
    // missing button.
    await screen.findByTestId("referral-code");
    expect(screen.getByRole("button", { name: /copy link/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /copy code/i })).toBeInTheDocument();
    const whatsapp = screen.getByRole("link", { name: /share on whatsapp/i });
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("https://wa.me/?text="));
    expect(whatsapp).toHaveAttribute("href", expect.stringContaining("DONALD7K3Q"));
  });

  it("hides the programme instead of breaking when it is unavailable", async () => {
    // The shape the BFF proxy really returns, not the backend's original body.
    mocks.me.mockRejectedValue(
      new ApiError(503, { error: "service_unavailable", message: "We couldn't reach the care service right now." } as never),
    );

    render(<ReferralProgramClient />, { wrapper });

    expect(await screen.findByText(/temporarily unavailable/i)).toBeInTheDocument();
    // No promotional surfaces and no code to share.
    expect(screen.queryByTestId("referral-code")).not.toBeInTheDocument();
    expect(screen.queryByText(/your rewards/i)).not.toBeInTheDocument();
  });

  it("shows an empty referral state with a way to share", async () => {
    render(<ReferralProgramClient />, { wrapper });

    expect(await screen.findByText(/haven't referred anyone yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /share referral link/i })).toBeInTheDocument();
  });

  it("lists referrals with privacy-safe status only", async () => {
    mocks.referrals.mockResolvedValue(
      page([
        referral({ status: "successful" }),
        referral({ public_id: "33333333-3333-3333-3333-333333333333", status: "qualifying" }),
        referral({ public_id: "44444444-4444-4444-4444-444444444444", status: "under_review" }),
      ]),
    );

    const { container } = render(<ReferralProgramClient />, { wrapper });

    // "Successful" is also a stats label, so assert the per-referral pills.
    expect(await screen.findAllByText("Successful")).not.toHaveLength(0);
    expect(screen.getByText("Qualifying")).toBeInTheDocument();
    expect(screen.getByText("Under review")).toBeInTheDocument();
    expect(screen.getAllByText(/Invite sent/i)).toHaveLength(3);
    // No referee identity, and no internal identifiers leak into the markup.
    expect(container.textContent).not.toMatch(/@|\+234|payment|fraud|fingerprint/i);
  });

  it("shows an available reward with the server's own values", async () => {
    mocks.rewards.mockResolvedValue(page([reward()]));

    render(<ReferralProgramClient />, { wrapper });

    expect(await screen.findByText("25% off")).toBeInTheDocument();
    expect(screen.getByText(/Up to ₦3,000/)).toBeInTheDocument();
    expect(screen.getByText("Available")).toBeInTheDocument();
  });

  it("explains a reserved reward and how to release it", async () => {
    mocks.rewards.mockResolvedValue(page([reward({ status: "reserved", is_redeemable: false })]));

    render(<ReferralProgramClient />, { wrapper });

    // The status pill and the explanation both mention it, which is intentional.
    expect(await screen.findAllByText(/reserved for a pending booking/i)).not.toHaveLength(0);
    expect(screen.getByText(/Cancel that booking if you want to release the reward/i)).toBeInTheDocument();
  });

  it("marks an expired reward without relying on colour", async () => {
    mocks.rewards.mockResolvedValue(
      page([reward({ status: "expired", is_redeemable: false, expires_at: "2026-01-01T10:00:00Z" })]),
    );

    render(<ReferralProgramClient />, { wrapper });

    expect(await screen.findByText("Expired")).toBeInTheDocument();
  });

  // Product rule: a referral code can only be applied while creating an account. An existing
  // logged-in user has no way to attach one, so the page must not offer it -- to anyone,
  // referred or not -- and must never call the attach endpoint.
  it("never offers an existing user a way to apply a referral code", async () => {
    render(<ReferralProgramClient />, { wrapper });

    await screen.findByText("DONALD7K3Q");

    expect(screen.queryByRole("button", { name: /apply code/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/have a referral code/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/referral code/i)).not.toBeInTheDocument();
    expect(mocks.attach).not.toHaveBeenCalled();
  });

  it("still offers nothing to apply once the patient already has a referral", async () => {
    mocks.referrals.mockResolvedValue(page([referral()]));

    render(<ReferralProgramClient />, { wrapper });

    await waitFor(() => expect(screen.getAllByText(/Invite sent/i)).not.toHaveLength(0));
    expect(screen.queryByRole("button", { name: /apply code/i })).not.toBeInTheDocument();
    expect(mocks.attach).not.toHaveBeenCalled();
  });
});
