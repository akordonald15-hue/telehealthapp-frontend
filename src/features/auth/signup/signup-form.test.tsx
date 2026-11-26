import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/auth/google-auth-button", () => ({
  GoogleAuthButton: () => <div data-testid="google-slot" />,
}));

import { SignupAccountForm, SignupEmailForm } from "./signup-form";
import type { SignupAccountValues, SignupFormErrors } from "./signup-form";

const accountDefaults: SignupAccountValues = {
  email: "patient@example.test",
  password: "",
  phone: "",
  referral: "",
  terms: false,
};

function renderAccount({
  values = {},
  fieldErrors,
  isSubmitting,
  onValid = vi.fn(),
}: {
  values?: Partial<SignupAccountValues>;
  fieldErrors?: SignupFormErrors;
  isSubmitting?: boolean;
  onValid?: (values: unknown) => void;
} = {}) {
  render(
    <SignupAccountForm
      defaultValues={{ ...accountDefaults, ...values }}
      fieldErrors={fieldErrors}
      isSubmitting={isSubmitting}
      onValid={onValid}
    />,
  );

  return onValid;
}

describe("SignupEmailForm", () => {
  it("disables submit until an email is entered", async () => {
    const user = userEvent.setup();
    render(<SignupEmailForm onValid={vi.fn()} />);

    const submit = screen.getByRole("button", { name: /sign up/i });
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/^email/i), "patient@example.test");
    expect(submit).toBeEnabled();
  });

  it("shows the invalid-email error, announces it and focuses the field", async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<SignupEmailForm onValid={onValid} />);

    const input = screen.getByLabelText(/^email/i);
    await user.type(input, "not-an-email");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    const message = await screen.findByRole("alert");
    expect(message).toHaveTextContent("Enter a valid email address.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toBe(message.id);
    expect(input).toHaveFocus();
    expect(onValid).not.toHaveBeenCalled();
  });

  it("submits a valid email", async () => {
    const user = userEvent.setup();
    const onValid = vi.fn();
    render(<SignupEmailForm onValid={onValid} />);

    await user.type(screen.getByLabelText(/^email/i), "patient@example.test");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onValid).toHaveBeenCalledWith({ email: "patient@example.test" });
  });
});

describe("SignupAccountForm", () => {
  it("gates submit on the agreement checkbox", async () => {
    const user = userEvent.setup();
    renderAccount();

    const submit = screen.getByRole("button", { name: /sign up/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: /terms and privacy agreement/i }));
    expect(submit).toBeEnabled();
  });

  it("shows the password error, focuses it and blocks submission", async () => {
    const user = userEvent.setup();
    const onValid = renderAccount({ values: { password: "123", phone: "08012345678", terms: true } });

    const password = screen.getByLabelText(/^password/i);
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(await screen.findByText("Password is too short")).toBeInTheDocument();
    expect(password).toHaveAttribute("aria-invalid", "true");
    expect(password).toHaveFocus();
    expect(onValid).not.toHaveBeenCalled();
  });

  it("submits when the account details are valid", async () => {
    const user = userEvent.setup();
    const onValid = renderAccount({
      values: { password: "caretekk2026", phone: "08012345678", terms: true },
    });

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(onValid).toHaveBeenCalledTimes(1);
    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "patient@example.test",
        password: "caretekk2026",
        phone: "08012345678",
        terms: true,
      }),
    );
  });

  it("shows the password success state while typing a long enough password", async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.type(screen.getByLabelText(/^password/i), "caretekk2026");

    expect(screen.getByText("Password meets the requirements")).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).not.toHaveAttribute("aria-invalid");
  });

  it("links the agreement error to the checkbox and announces it", async () => {
    const user = userEvent.setup();
    renderAccount();

    const checkbox = screen.getByRole("checkbox", { name: /terms and privacy agreement/i });
    checkbox.focus();
    await user.tab();

    const message = await screen.findByRole("alert");
    expect(message).toHaveTextContent("You must accept the Terms and Privacy Agreement");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox.getAttribute("aria-describedby")).toBe(message.id);
  });

  it("keeps the submit disabled and shows progress while submitting", () => {
    renderAccount({
      values: { password: "caretekk2026", phone: "08012345678", terms: true },
      isSubmitting: true,
    });

    const submit = screen.getByRole("button", { name: /creating your account/i });
    expect(submit).toBeDisabled();
    expect(submit.closest("form")).toHaveAttribute("aria-busy", "true");
  });

  it("toggles password visibility with an accessible label", async () => {
    const user = userEvent.setup();
    renderAccount();

    const password = screen.getByLabelText(/^password/i);
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: /hide password/i })).toBeInTheDocument();
  });

  it("points the legal links at the placeholder routes", () => {
    renderAccount();

    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Login" })).toHaveAttribute("href", "/login");
  });
});
