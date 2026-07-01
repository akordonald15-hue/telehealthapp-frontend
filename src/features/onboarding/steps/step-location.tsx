"use client";

import { useEffect } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { SelectField } from "../form-fields";
import { getLgasForState, STATE_NAMES } from "../nigeria-locations";
import type { OnboardingValues } from "../onboarding-schema";

const stateOptions = STATE_NAMES.map((name) => ({ value: name, label: name }));

export function StepLocation() {
  const { control, setValue, getValues } = useFormContext<OnboardingValues>();
  const selectedState = useWatch({ control, name: "state" });
  const lgaOptions = getLgasForState(selectedState).map((lga) => ({ value: lga, label: lga }));

  // Clear a stale LGA whenever the state changes to one that doesn't contain it.
  useEffect(() => {
    const currentLga = getValues("lga");
    if (currentLga && !getLgasForState(selectedState).includes(currentLga)) {
      setValue("lga", "", { shouldValidate: false });
    }
  }, [selectedState, getValues, setValue]);

  return (
    <div className="grid gap-4">
      <SelectField
        name="state"
        label="State"
        options={stateOptions}
        placeholder="Select your state"
        required
      />
      <SelectField
        name="lga"
        label="Local Government Area"
        options={lgaOptions}
        placeholder={selectedState ? "Select your LGA" : "Select a state first"}
        disabled={!selectedState}
        required
      />
    </div>
  );
}
