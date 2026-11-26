"use client";

import { Field, Input, SelectMenu } from "@/components/ds";

import { AGE_RANGE_OPTIONS, GENDER_SELECT_OPTIONS } from "../onboarding-options";

export type StepWelcomeValues = {
  fullName: string;
  gender: string;
  ageRange: string;
};

export type StepWelcomeErrors = Partial<Record<keyof StepWelcomeValues, string>>;

type StepWelcomeProps = {
  values: StepWelcomeValues;
  errors?: StepWelcomeErrors;
  onChange: (field: keyof StepWelcomeValues, value: string) => void;
  onBlur?: (field: keyof StepWelcomeValues) => void;
  genderMenuDefaultOpen?: boolean;
  ageRangeMenuDefaultOpen?: boolean;
  disabled?: boolean;
};

// Step 1 (Figma 2545:2617): Full Name + Gender + Age Range. Age Range is the
// approved deviation (D2) so the two-step flow can satisfy the backend contract.
export function StepWelcome({
  values,
  errors,
  onChange,
  onBlur,
  genderMenuDefaultOpen,
  ageRangeMenuDefaultOpen,
  disabled,
}: StepWelcomeProps) {
  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="type-heading-4 text-primary-500">Welcome to Caretekk Onboarding</h1>
        <p className="type-body-giant text-grey-600">
          We would want to know a bit about you. Please, we just have a few questions.
        </p>
      </header>

      <div className="grid gap-3">
        <Field label="Full Name" error={errors?.fullName} required>
          <Input
            id="onboarding-full-name"
            autoComplete="name"
            placeholder="Enter your full name"
            disabled={disabled}
            value={values.fullName}
            onChange={(event) => onChange("fullName", event.target.value)}
            onBlur={() => onBlur?.("fullName")}
          />
        </Field>

        <Field label="Gender" labelAs="div" error={errors?.gender} required>
          <SelectMenu
            id="onboarding-gender"
            options={GENDER_SELECT_OPTIONS}
            value={values.gender}
            onChange={(value) => onChange("gender", value)}
            onBlur={() => onBlur?.("gender")}
            placeholder="Select gender"
            disabled={disabled}
            defaultOpen={genderMenuDefaultOpen}
          />
        </Field>

        <Field label="Age Range" labelAs="div" error={errors?.ageRange} required>
          <SelectMenu
            id="onboarding-age-range"
            options={AGE_RANGE_OPTIONS}
            value={values.ageRange}
            onChange={(value) => onChange("ageRange", value)}
            onBlur={() => onBlur?.("ageRange")}
            placeholder="Select age range"
            disabled={disabled}
            defaultOpen={ageRangeMenuDefaultOpen}
          />
        </Field>
      </div>
    </div>
  );
}
