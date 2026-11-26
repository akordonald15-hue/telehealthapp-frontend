import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { OnboardingPreview } from "./onboarding-preview";

describe("OnboardingPreview", () => {
  it("renders step 1 empty with Continue disabled", () => {
    render(<OnboardingPreview initialPreview="welcome-empty" />);

    expect(screen.getByRole("heading", { name: "Welcome to Caretekk Onboarding" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Full Name" })).toHaveValue("");
    expect(screen.getByRole("combobox", { name: /Gender/ })).toHaveTextContent("Select gender");
    expect(screen.getByRole("combobox", { name: /Age Range/ })).toHaveTextContent("Select age range");
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("renders step 1 filled with Continue enabled", () => {
    render(<OnboardingPreview initialPreview="welcome-filled" />);

    expect(screen.getByRole("textbox", { name: "Full Name" })).toHaveValue("David Johnson");
    expect(screen.getByRole("combobox", { name: /Gender/ })).toHaveTextContent("Male");
    expect(screen.getByRole("combobox", { name: /Age Range/ })).toHaveTextContent("25-34");
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("renders step 2 complete with Back and Continue enabled", () => {
    render(<OnboardingPreview initialPreview="basic-complete" />);

    expect(screen.getByRole("heading", { name: "Basic Information" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /State/ })).toHaveTextContent("Akwa Ibom");
    expect(screen.getByRole("combobox", { name: /Local Government/ })).toHaveTextContent("Eket");
    expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });

  it("renders the state and LGA menus open with their full lists", () => {
    const { unmount } = render(<OnboardingPreview initialPreview="basic-state-open" />);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Akwa Ibom" })).toBeInTheDocument();
    unmount();

    render(<OnboardingPreview initialPreview="basic-lga-open" />);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /^Eket$/ })).toBeInTheDocument();
  });

  it("renders required errors and disables the dependent LGA field", () => {
    const { unmount } = render(<OnboardingPreview initialPreview="welcome-errors" />);
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    unmount();

    render(<OnboardingPreview initialPreview="basic-errors" />);
    expect(screen.getByText("Select your state.")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Local Government/ })).toBeDisabled();
  });

  it("moves from step 1 to step 2 and back without a network call", async () => {
    const user = userEvent.setup();
    render(<OnboardingPreview initialPreview="welcome-empty" />);

    await user.type(screen.getByRole("textbox", { name: "Full Name" }), "Ada Okafor");
    await user.click(screen.getByRole("combobox", { name: /Gender/ }));
    await user.click(screen.getByRole("option", { name: "Female" }));
    await user.click(screen.getByRole("combobox", { name: /Age Range/ }));
    await user.click(screen.getByRole("option", { name: "25-34" }));

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeEnabled();

    await user.click(continueButton);
    expect(screen.getByRole("heading", { name: "Basic Information" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Welcome to Caretekk Onboarding" })).toBeInTheDocument();
  });
});
