import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const searchParams = { value: new URLSearchParams() };
const routerMock = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
  useSearchParams: () => searchParams.value,
}));

const authMocks = vi.hoisted(() => ({
  register: vi.fn(),
  otpRequest: vi.fn(),
}));

vi.mock("@/lib/api/endpoints", () => ({ authApi: authMocks }));
vi.mock("@/features/auth/google-auth-button", () => ({ GoogleAuthButton: () => null }));

import { readPendingReferralCode } from "@/features/referral-program/referral-code-storage";

import { RegisterForm } from "./register-form";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

beforeEach(() => {
  window.sessionStorage.clear();
  searchParams.value = new URLSearchParams();
  authMocks.register.mockResolvedValue({ id: 1, email: "new@example.test", phone: "", role: "patient" });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("registration referral integration", () => {
  it("persists a code arriving on the URL so it survives the OTP hop", async () => {
    // Regression: signup leaves this route for /verify-email, so a code held only in the query
    // string or in form state is lost on the way back.
    searchParams.value = new URLSearchParams({ ref: "donald-7k3q" });

    render(<RegisterForm />, { wrapper });

    await waitFor(() => expect(readPendingReferralCode()).toBe("DONALD7K3Q"));
  });

  it("pre-fills the optional field from the stored code on the final step", async () => {
    window.sessionStorage.setItem("caretekk.referral.pending_code", "DONALD7K3Q");
    window.sessionStorage.setItem("caretekk.auth.verified_email", "new@example.test");
    searchParams.value = new URLSearchParams({ verified: "1" });

    render(<RegisterForm />, { wrapper });

    const field = await screen.findByLabelText(/referral code \(optional\)/i);
    await waitFor(() => expect(field).toHaveValue("DONALD7K3Q"));
  });

  it("lets the patient clear the pre-filled code before submitting", async () => {
    window.sessionStorage.setItem("caretekk.referral.pending_code", "DONALD7K3Q");
    window.sessionStorage.setItem("caretekk.auth.verified_email", "new@example.test");
    searchParams.value = new URLSearchParams({ verified: "1" });

    render(<RegisterForm />, { wrapper });

    const field = await screen.findByLabelText(/referral code \(optional\)/i);
    expect(field).not.toHaveAttribute("readonly");
    expect(field).not.toBeDisabled();
  });

  it("treats a refused referral as information, not a failed signup", async () => {
    authMocks.register.mockResolvedValue({
      id: 1,
      email: "new@example.test",
      phone: "",
      role: "patient",
      referral: { applied: false, detail: "That referral code could not be applied." },
    });
    window.sessionStorage.setItem("caretekk.referral.pending_code", "DONALD7K3Q");
    window.sessionStorage.setItem("caretekk.auth.verified_email", "new@example.test");
    searchParams.value = new URLSearchParams({ verified: "1" });

    render(<RegisterForm />, { wrapper });

    await userEvent.type(await screen.findByLabelText(/^phone/i), "08030001234");
    await userEvent.type(screen.getByLabelText(/^password/i), "Str0ngPassw0rd!");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    // The account exists; only the invite failed. Say so, and do not bounce them to /login as
    // though nothing happened.
    expect(await screen.findByText(/your account was created/i)).toBeInTheDocument();
    expect(screen.getByText(/could not be applied/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue to sign in/i })).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalledWith("/login");
    // The code was sent, normalised.
    expect(authMocks.register.mock.calls[0][0]).toMatchObject({ referral_code: "DONALD7K3Q" });
  });

  it("goes straight to sign-in when the referral was applied", async () => {
    authMocks.register.mockResolvedValue({
      id: 1,
      email: "new@example.test",
      phone: "",
      role: "patient",
      referral: { applied: true, detail: "Referral code applied." },
    });
    window.sessionStorage.setItem("caretekk.referral.pending_code", "DONALD7K3Q");
    window.sessionStorage.setItem("caretekk.auth.verified_email", "new@example.test");
    searchParams.value = new URLSearchParams({ verified: "1" });

    render(<RegisterForm />, { wrapper });

    await userEvent.type(await screen.findByLabelText(/^phone/i), "08030001234");
    await userEvent.type(screen.getByLabelText(/^password/i), "Str0ngPassw0rd!");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/login"));
    expect(readPendingReferralCode()).toBe("");
  });

  it("does not send a referral_code when the field is left empty", async () => {
    window.sessionStorage.setItem("caretekk.auth.verified_email", "new@example.test");
    searchParams.value = new URLSearchParams({ verified: "1" });

    render(<RegisterForm />, { wrapper });

    await userEvent.type(await screen.findByLabelText(/^phone/i), "08030001234");
    await userEvent.type(screen.getByLabelText(/^password/i), "Str0ngPassw0rd!");
    await userEvent.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(authMocks.register).toHaveBeenCalled());
    expect(authMocks.register.mock.calls[0][0]).not.toHaveProperty("referral_code");
  });
});
