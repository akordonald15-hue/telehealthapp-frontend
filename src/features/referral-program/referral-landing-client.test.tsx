import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ReferralLandingClient } from "./referral-landing-client";
import { readPendingReferralCode } from "./referral-code-storage";

function signIn() {
  document.cookie = "caretekk_session=1; Path=/";
}

function signOut() {
  document.cookie = "caretekk_session=; Path=/; Max-Age=0";
}

describe("/r/<code> landing", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    signOut();
  });

  it("welcomes the visitor and sends them into the normal signup flow", () => {
    render(<ReferralLandingClient code="DONALD7K3Q" />);

    expect(screen.getByRole("heading", { name: /invited to caretekk/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute(
      "href",
      "/register?ref=DONALD7K3Q",
    );
    expect(screen.getByRole("link", { name: /already have an account/i })).toHaveAttribute("href", "/login");
  });

  it("preserves the code for the signup request", () => {
    render(<ReferralLandingClient code="donald-7k3q" />);

    expect(readPendingReferralCode()).toBe("DONALD7K3Q");
    expect(screen.getByText("DONALD7K3Q")).toBeInTheDocument();
  });

  it("never names or hints at the referrer", () => {
    const { container } = render(<ReferralLandingClient code="DONALD7K3Q" />);

    // v1 rewards the referrer, so the visitor is promised nothing and told nothing about them.
    expect(container.textContent).not.toMatch(/invited you|your friend .* referred|25%|discount/i);
  });

  it("still renders and still allows signup when the code is malformed", () => {
    render(<ReferralLandingClient code="!!" />);

    expect(screen.getByRole("heading", { name: /invited to caretekk/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toHaveAttribute("href", "/register");
    expect(screen.getByText(/invite link looks incomplete/i)).toBeInTheDocument();
    expect(readPendingReferralCode()).toBe("");
  });
});

// Product rule: referral codes are signup-only. An existing account can never attach one, so
// the invite link must be a dead end for them -- informative, but with no effect whatsoever.
describe("/r/<code> landing for someone already signed in", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    signIn();
  });

  afterEach(() => {
    signOut();
  });

  it("explains the rule instead of offering to apply the code", () => {
    render(<ReferralLandingClient code="DONALD7K3Q" />);

    expect(
      screen.getByText(/referral codes can only be applied when creating a new caretekk account/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /get started/i })).not.toBeInTheDocument();
  });

  it("offers a way back into the app and to their own invite page", () => {
    render(<ReferralLandingClient code="DONALD7K3Q" />);

    expect(screen.getByRole("link", { name: /go to caretekk/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /refer & earn/i })).toHaveAttribute("href", "/refer");
  });

  it("does not store the code, so it cannot leak into a later signup on this browser", () => {
    render(<ReferralLandingClient code="DONALD7K3Q" />);

    expect(readPendingReferralCode()).toBe("");
  });
});
