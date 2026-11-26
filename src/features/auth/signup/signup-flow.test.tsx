import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routerMock = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

const authMocks = vi.hoisted(() => ({
  otpRequest: vi.fn(),
  otpVerify: vi.fn(),
  register: vi.fn(),
}));

vi.mock("@/lib/api/endpoints", () => ({ authApi: authMocks }));
vi.mock("@/features/auth/google-auth-button", () => ({ GoogleAuthButton: () => null }));

import { readPendingReferralCode } from "@/features/referral-program/referral-code-storage";

import { SignupFlow } from "./signup-flow";

function renderFlow(props: { verified?: boolean; emailFromUrl?: string; referralFromUrl?: string } = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  render(
    <QueryClientProvider client={client}>
      <SignupFlow {...props} />
    </QueryClientProvider>,
  );
}

async function enterCode(code = "123456") {
  const firstDigit = await screen.findByLabelText("Digit 1 of 6");
  fireEvent.change(firstDigit, { target: { value: code } });
}

beforeEach(() => {
  window.sessionStorage.clear();
  vi.clearAllMocks();
  authMocks.otpRequest.mockResolvedValue({ detail: "Code sent." });
  authMocks.otpVerify.mockResolvedValue({ detail: "Verified." });
  authMocks.register.mockResolvedValue({
    id: 1,
    email: "new@example.test",
    phone: "+2348012345678",
    role: "patient",
  });
});

describe("SignupFlow", () => {
  it("requests a code and moves to the OTP step", async () => {
    const user = userEvent.setup();
    renderFlow();

    await user.type(screen.getByLabelText(/^email/i), "new@example.test");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => expect(authMocks.otpRequest).toHaveBeenCalledWith({ email: "new@example.test" }));
    expect(await screen.findByText("Confirm your email")).toBeInTheDocument();
    expect(screen.getByLabelText("Digit 1 of 6")).toBeInTheDocument();
  });

  it("verifies the code and shows the account step", async () => {
    const user = userEvent.setup();
    renderFlow();

    await user.type(screen.getByLabelText(/^email/i), "new@example.test");
    await user.click(screen.getByRole("button", { name: /sign up/i }));
    await enterCode();
    await user.click(screen.getByRole("button", { name: /confirm email/i }));

    await waitFor(() =>
      expect(authMocks.otpVerify).toHaveBeenCalledWith({ email: "new@example.test", code: "123456" }),
    );

    const password = await screen.findByLabelText(/^password/i);
    expect(password).toHaveValue("");
    expect(screen.getByLabelText(/^email/i)).toHaveValue("new@example.test");
    expect(screen.getByLabelText(/^email/i)).toHaveAttribute("readonly");
  });

  it("registers the account with a normalised phone and the referral code", async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem("caretekk.auth.verified_email", "new@example.test");
    renderFlow({ verified: true, referralFromUrl: "donald-7k3q" });

    expect(await screen.findByDisplayValue("DONALD7K3Q")).toBeInTheDocument();
    expect(readPendingReferralCode()).toBe("DONALD7K3Q");

    await user.type(screen.getByLabelText(/^password/i), "caretekk2026");
    await user.type(screen.getByLabelText(/^phone/i), "08012345678");
    await user.click(screen.getByRole("checkbox", { name: /terms and privacy agreement/i }));
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() =>
      expect(authMocks.register).toHaveBeenCalledWith({
        email: "new@example.test",
        password: "caretekk2026",
        phone: "+2348012345678",
        referral_code: "DONALD7K3Q",
      }),
    );
    expect(routerMock.replace).toHaveBeenCalledWith("/login");
  });

  it("starts at the account step for a verified deep link", async () => {
    window.sessionStorage.setItem("caretekk.auth.verified_email", "verified@example.test");
    renderFlow({ verified: true });

    expect(await screen.findByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email/i)).toHaveValue("verified@example.test");
    expect(authMocks.otpRequest).not.toHaveBeenCalled();
  });

  it("redirects a verified deep link that has no stored email", async () => {
    renderFlow({ verified: true });

    await waitFor(() => expect(routerMock.replace).toHaveBeenCalledWith("/register"));
  });

  it("shows a friendly message when requesting the code fails", async () => {
    const user = userEvent.setup();
    authMocks.otpRequest.mockRejectedValue(new Error("Throttled"));
    renderFlow();

    await user.type(screen.getByLabelText(/^email/i), "new@example.test");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText(/made a few requests in a short time/i)).toBeInTheDocument();
  });

  it("explains a referral code that could not be applied", async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem("caretekk.auth.verified_email", "new@example.test");
    authMocks.register.mockResolvedValue({
      id: 1,
      email: "new@example.test",
      phone: "+2348012345678",
      role: "patient",
      referral: { applied: false, detail: "That code has expired." },
    });
    renderFlow({ verified: true, referralFromUrl: "DONALD7K3Q" });

    await screen.findByDisplayValue("DONALD7K3Q");
    await user.type(screen.getByLabelText(/^password/i), "caretekk2026");
    await user.type(screen.getByLabelText(/^phone/i), "08012345678");
    await user.click(screen.getByRole("checkbox", { name: /terms and privacy agreement/i }));
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText("Your account was created")).toBeInTheDocument();
    expect(screen.getByText(/That code has expired/)).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalledWith("/login");
  });
});
