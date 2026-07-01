"use client";

import { OptionCardGroup, TextField } from "../form-fields";
import { GENDER_OPTIONS } from "../onboarding-schema";

export function StepPersonal() {
  return (
    <div className="grid gap-5">
      <TextField name="dob" label="Date of Birth" type="date" required />
      <OptionCardGroup name="gender" label="Gender" options={[...GENDER_OPTIONS]} required />
    </div>
  );
}
