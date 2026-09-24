import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ReferralLandingClient } from "./referral-landing-client";
import { readPendingReferralCode } from "./referral-code-storage";

describe("/r/<code> landing", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
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
