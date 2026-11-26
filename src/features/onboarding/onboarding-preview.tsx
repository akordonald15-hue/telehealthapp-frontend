"use client";

import { useState } from "react";

import { OnboardingScreen } from "@/components/layout/onboarding-screen";

import { getLgasForState } from "./nigeria-locations";
import { OnboardingFooter } from "./onboarding-footer";
import { StepBasicInfo, type StepBasicInfoErrors } from "./steps/step-basic-info";
import { StepWelcome, type StepWelcomeErrors } from "./steps/step-welcome";

type PreviewStep = 1 | 2;

type PreviewKey =
  | "welcome-empty"
  | "welcome-filled"
  | "welcome-errors"
  | "basic-empty"
  | "basic-state-open"
  | "basic-lga-open"
  | "basic-complete"
  | "basic-errors";

type PreviewValues = {
  fullName: string;
  gender: string;
  ageRange: string;
  state: string;
  lga: string;
};

type PreviewDefaults = {
  step: PreviewStep;
  values: PreviewValues;
  errors: StepWelcomeErrors & StepBasicInfoErrors;
  stateMenuDefaultOpen?: boolean;
  lgaMenuDefaultOpen?: boolean;
};

const emptyValues: PreviewValues = {
  fullName: "",
  gender: "",
  ageRange: "",
  state: "",
  lga: "",
};

const filledPerson: PreviewValues = {
  fullName: "David Johnson",
  gender: "male",
  ageRange: "25-34",
  state: "",
  lga: "",
};

const PREVIEWS: Record<PreviewKey, PreviewDefaults> = {
  "welcome-empty": {
    step: 1,
    values: emptyValues,
    errors: {},
  },
  "welcome-filled": {
    step: 1,
    values: { ...filledPerson },
    errors: {},
  },
  "welcome-errors": {
    step: 1,
    values: emptyValues,
    errors: {
      fullName: "Enter your first and last name.",
      gender: "Select your gender.",
      ageRange: "Select your age range.",
    },
  },
  "basic-empty": {
    step: 2,
    values: { ...filledPerson },
    errors: {},
  },
  "basic-state-open": {
    step: 2,
    values: { ...filledPerson },
    errors: {},
    stateMenuDefaultOpen: true,
  },
  "basic-lga-open": {
    step: 2,
    values: { ...filledPerson, state: "Akwa Ibom" },
    errors: {},
    lgaMenuDefaultOpen: true,
  },
  "basic-complete": {
    step: 2,
    values: { ...filledPerson, state: "Akwa Ibom", lga: "Eket" },
    errors: {},
  },
  "basic-errors": {
    step: 2,
    values: { ...filledPerson },
    errors: {
      state: "Select your state.",
    },
  },
};

function normalizePreview(value: string | string[] | undefined): PreviewKey {
  const key = Array.isArray(value) ? value[0] : value;
  return key && key in PREVIEWS ? (key as PreviewKey) : "welcome-empty";
}

// Static visual QA surface for Step 3. It holds local state so menus and
// fields can be exercised, but it performs no validation or network calls.
// Open a state with /onboarding?preview=basic-state-open.
export function OnboardingPreview({ initialPreview }: { initialPreview?: string | string[] }) {
  const preview = PREVIEWS[normalizePreview(initialPreview)];
  const [step, setStep] = useState<PreviewStep>(preview.step);
  const [values, setValues] = useState<PreviewValues>(() => ({ ...preview.values }));
  const [errors, setErrors] = useState<StepWelcomeErrors & StepBasicInfoErrors>(() => ({ ...preview.errors }));

  const update = (field: keyof PreviewValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "state" && !getLgasForState(value).includes(current.lga)) {
        next.lga = "";
      }
      return next;
    });
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const stepOneComplete =
    values.fullName.trim().length > 0 && values.gender !== "" && values.ageRange !== "";
  const stepTwoComplete = values.state !== "" && values.lga !== "";
  const isStepOne = step === 1;

  return (
    <OnboardingScreen
      footer={
        <OnboardingFooter
          showBack={!isStepOne}
          onBack={() => setStep(1)}
          onContinue={() => {
            if (isStepOne) {
              if (stepOneComplete) setStep(2);
            }
            // Preview only: the save action arrives in Step 5.
          }}
          continueDisabled={isStepOne ? !stepOneComplete : !stepTwoComplete}
        />
      }
    >
      {isStepOne ? (
        <StepWelcome
          values={{ fullName: values.fullName, gender: values.gender, ageRange: values.ageRange }}
          errors={errors}
          onChange={update}
        />
      ) : (
        <StepBasicInfo
          values={{ state: values.state, lga: values.lga }}
          errors={errors}
          onChange={update}
          stateMenuDefaultOpen={preview.stateMenuDefaultOpen}
          lgaMenuDefaultOpen={preview.lgaMenuDefaultOpen}
        />
      )}
    </OnboardingScreen>
  );
}
