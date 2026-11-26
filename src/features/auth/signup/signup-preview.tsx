"use client";

import { SignupCard } from "./signup-card";
import { SignupAccountForm, SignupEmailForm } from "./signup-form";
import type { SignupAccountValues, SignupFormErrors } from "./signup-form";

type PreviewStage = "email" | "account";
type PreviewState = "empty" | "filled" | "error";

const filledValues: SignupAccountValues = {
  email: "demo@example.test",
  password: "caretekk-demo",
  phone: "08012345678",
  referral: "",
  terms: true,
};

const emptyValues: SignupAccountValues = {
  email: "demo@example.test",
  password: "",
  phone: "",
  referral: "",
  terms: false,
};

export function SignupPreview({
  stage = "email",
  state = "empty",
}: {
  stage?: PreviewStage;
  state?: PreviewState;
}) {
  return (
    <SignupCard>
      {stage === "account" ? <AccountPreview state={state} /> : <EmailPreview filled={state !== "empty"} />}
    </SignupCard>
  );
}

function EmailPreview({ filled }: { filled: boolean }) {
  return (
    <SignupEmailForm
      initialEmail={filled ? "demo@example.test" : ""}
      onValid={() => undefined}
    />
  );
}

function AccountPreview({ state }: { state: PreviewState }) {
  const fieldErrors: SignupFormErrors | undefined =
    state === "error" ? { password: "Password is too short" } : undefined;

  return (
    <SignupAccountForm
      defaultValues={
        state === "error"
          ? { ...filledValues, password: "123" }
          : state === "filled"
            ? filledValues
            : emptyValues
      }
      fieldErrors={fieldErrors}
      onValid={() => undefined}
    />
  );
}
