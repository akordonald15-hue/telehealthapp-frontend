"use client";

import { TextField } from "../form-fields";

export function StepBasicInfo({
  onFullNameChange,
  onPhoneChange,
}: {
  onFullNameChange?: (value: string) => void;
  onPhoneChange?: (value: string) => void;
}) {
  return (
    <div className="grid gap-4">
      <TextField
        name="full_name"
        label="Full Name"
        placeholder="e.g. Ada Okafor"
        autoComplete="name"
        onValueChange={onFullNameChange}
        required
      />
      <TextField
        name="phone"
        label="Phone Number"
        type="tel"
        inputMode="tel"
        placeholder="08012345678"
        autoComplete="tel"
        onValueChange={onPhoneChange}
        required
      />
    </div>
  );
}
