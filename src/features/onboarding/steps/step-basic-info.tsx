"use client";

import { Field, SelectMenu } from "@/components/ds";

import { getLgaOptions, STATE_OPTIONS } from "../onboarding-options";

export type StepBasicInfoValues = {
  state: string;
  lga: string;
};

export type StepBasicInfoErrors = Partial<Record<keyof StepBasicInfoValues, string>>;

type StepBasicInfoProps = {
  values: StepBasicInfoValues;
  errors?: StepBasicInfoErrors;
  onChange: (field: keyof StepBasicInfoValues, value: string) => void;
  onBlur?: (field: keyof StepBasicInfoValues) => void;
  stateMenuDefaultOpen?: boolean;
  lgaMenuDefaultOpen?: boolean;
  disabled?: boolean;
};

// Step 2 (Figma 2545:2699): State + Local Government. The Figma "Country" field
// is replaced by State; LGA options depend on the selected state.
export function StepBasicInfo({
  values,
  errors,
  onChange,
  onBlur,
  stateMenuDefaultOpen,
  lgaMenuDefaultOpen,
  disabled,
}: StepBasicInfoProps) {
  const lgaOptions = getLgaOptions(values.state);

  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="type-heading-4 text-primary-500">Basic Information</h1>
        <p className="type-body-giant text-grey-600">
          We would want to know a bit about you. Please, we just have a few questions.
        </p>
      </header>

      <div className="grid gap-3">
        <Field label="State" labelAs="div" error={errors?.state} required>
          <SelectMenu
            id="onboarding-state"
            options={STATE_OPTIONS}
            value={values.state}
            onChange={(value) => onChange("state", value)}
            onBlur={() => onBlur?.("state")}
            placeholder="Select state"
            defaultOpen={stateMenuDefaultOpen}
            disabled={disabled}
            required
          />
        </Field>

        <Field label="Local Government" labelAs="div" error={errors?.lga} required>
          <SelectMenu
            id="onboarding-lga"
            options={lgaOptions}
            value={values.lga}
            onChange={(value) => onChange("lga", value)}
            onBlur={() => onBlur?.("lga")}
            placeholder={values.state ? "Select local government" : "Select a state first"}
            defaultOpen={lgaMenuDefaultOpen}
            disabled={disabled || !values.state}
            required
          />
        </Field>
      </div>
    </div>
  );
}
