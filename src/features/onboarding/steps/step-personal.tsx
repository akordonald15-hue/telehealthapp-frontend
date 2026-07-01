"use client";

import { OptionCardGroup } from "../form-fields";
import { AGE_RANGES, GENDER_OPTIONS } from "../onboarding-schema";

const ageOptions = AGE_RANGES.map((range) => ({ value: range, label: range }));

export function StepPersonal() {
  return (
    <div className="grid gap-5">
      <OptionCardGroup name="age_range" label="Age Range" options={ageOptions} required />
      <OptionCardGroup name="gender" label="Gender" options={[...GENDER_OPTIONS]} required />
    </div>
  );
}
