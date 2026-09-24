import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/profile",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  profile: vi.fn(),
  threads: vi.fn(),
  appointments: vi.fn(),
  payments: vi.fn(),
  referrals: vi.fn(),
}));

const EMPTY = { count: 0, next: null, previous: null, results: [] };

vi.mock("@/lib/api/endpoints", () => ({
  authApi: { me: mocks.me, changePassword: vi.fn(), logout: vi.fn() },
  profilesApi: { me: mocks.profile, update: vi.fn() },
  messagingApi: { threads: mocks.threads },
  appointmentsApi: { list: mocks.appointments },
  paymentsApi: { list: mocks.payments },
  referralsApi: { list: mocks.referrals },
}));

// Other roles are delegated to entirely separate dashboards; they are not under test here.
vi.mock("@/features/dashboard/doctor-dashboard-client", () => ({
  DoctorDashboardClient: () => <div>doctor dashboard</div>,
}));
vi.mock("@/features/nurse/nurse-dashboard-client", () => ({
  NurseDashboardClient: () => <div>nurse dashboard</div>,
}));
vi.mock("@/features/admin/admin-dashboard-client", () => ({
  AdminDashboardClient: () => <div>admin dashboard</div>,
}));

import { DashboardClient } from "@/features/dashboard/dashboard-client";
import { ProfileClient } from "@/features/profile/profile-client";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function signInAs(role: string) {
  document.cookie = "caretekk_session=1; Path=/";
  mocks.me.mockResolvedValue({
    id: 1,
    email: `${role}@caretekk.test`,
    phone: "",
    full_name: `Test ${role}`,
    role,
    must_change_password: false,
  });
}

const referLink = () => screen.queryByRole("link", { name: /refer & earn/i });

beforeEach(() => {
  mocks.profile.mockResolvedValue({ id: 1, profile_complete: true, full_name: "Test patient" });
  mocks.threads.mockResolvedValue(EMPTY);
  mocks.appointments.mockResolvedValue(EMPTY);
  mocks.payments.mockResolvedValue(EMPTY);
  mocks.referrals.mockResolvedValue(EMPTY);
});

afterEach(() => {
  document.cookie = "caretekk_session=; Path=/; Max-Age=0";
  vi.clearAllMocks();
});

// Nobody should ever have to type /refer to find the referral programme.
describe("Refer & Earn is discoverable from Home", () => {
  it("shows a patient a card linking to /refer", async () => {
    signInAs("patient");
    render(<DashboardClient />, { wrapper });

    await waitFor(() => expect(referLink()).toBeInTheDocument());
    expect(referLink()).toHaveAttribute("href", "/refer");
  });

  it("uses generic copy rather than hard-coding terms Home has not loaded", async () => {
    // The percentage, cap and expiry live in the programme API and are configurable. Home
    // does not read it, so it must not state any of them.
    signInAs("patient");
    render(<DashboardClient />, { wrapper });

    await waitFor(() => expect(referLink()).toBeInTheDocument());
    expect(referLink()?.textContent).toMatch(/invite friends and earn caretekk rewards/i);
    expect(referLink()?.textContent).not.toMatch(/\d+%|₦/);
  });

  it("does not break Home when the referral programme is unavailable", async () => {
    // The card is a plain link and reads no programme data, so there is nothing to fail.
    signInAs("patient");
    render(<DashboardClient />, { wrapper });

    await waitFor(() => expect(referLink()).toBeInTheDocument());
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it.each(["doctor", "nurse", "admin"])("shows no referral card to a %s", async (role) => {
    signInAs(role);
    render(<DashboardClient />, { wrapper });

    await screen.findByText(`${role} dashboard`);
    expect(referLink()).not.toBeInTheDocument();
  });
});

describe("Refer & Earn is discoverable from Profile", () => {
  it("gives a patient a Refer & Earn shortcut", async () => {
    signInAs("patient");
    render(<ProfileClient />, { wrapper });

    await waitFor(() => expect(referLink()).toBeInTheDocument());
    expect(referLink()).toHaveAttribute("href", "/refer");
  });

  it.each(["doctor", "nurse"])("shows no Refer & Earn shortcut to a %s", async (role) => {
    signInAs(role);
    render(<ProfileClient />, { wrapper });

    await screen.findByRole("heading", { name: /^profile$/i });
    expect(referLink()).not.toBeInTheDocument();
  });
});
