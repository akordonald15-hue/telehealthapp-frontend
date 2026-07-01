"use client";

import { useFormContext } from "react-hook-form";

import { TextField } from "../form-fields";
import type { OnboardingValues } from "../onboarding-schema";

export function StepBasicInfo() {
  const { watch } = useFormContext<OnboardingValues>();
  const email = watch("email") || "";

  return (
    <div className="grid gap-4">
      <TextField
        name="full_name"
        label="Full Name"
        placeholder="e.g. Ada Okafor"
        autoComplete="name"
        required
      />
      <TextField
        name="email"
        label="Email"
        type="email"
        readOnly
        value={email}
        hint="This is the email linked to your account."
      />
      {!email ? (
        <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
          Email not found. Please log in again.
        </div>
      ) : null}
      <TextField
        name="phone"
        label="Phone Number"
        type="tel"
        inputMode="tel"
        placeholder="08012345678"
        autoComplete="tel"
        required
      />
    </div>
  );
}
