"use client";

import { TextField } from "../form-fields";

export function StepBasicInfo() {
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
        hint="This is the email linked to your account."
      />
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
