import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";

describe("newsletter without a subscription integration", () => {
  it("does not collect an email or promise a successful subscription", async () => {
    const user = userEvent.setup();
    render(<SiteFooter />);

    const email = screen.getByRole("textbox", { name: "Email address" });
    const subscribe = screen.getByRole("button", { name: "Subscribe" });
    expect(email).toBeDisabled();
    expect(subscribe).toBeDisabled();
    expect(subscribe).toHaveAccessibleDescription(/not available yet.*no email address is collected/i);
    await user.type(email, "patient@example.test");
    await user.click(subscribe);
    expect(email).toHaveValue("");
    expect(screen.queryByText(/you're on the list/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute("href", expect.stringMatching(/^mailto:/));
  });
});
