"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";

import { getLgasForState } from "./nigeria-locations";
import { onboardingSchema, type OnboardingValues } from "./onboarding-schema";

export type OnboardingInitialValues = {
  full_name?: string;
  gender?: string;
  age_range?: string;
  state?: string;
  lga?: string;
};

function buildDefaults(initialValues?: OnboardingInitialValues): OnboardingValues {
  return {
    full_name: initialValues?.full_name ?? "",
    gender: (initialValues?.gender ?? "") as OnboardingValues["gender"],
    age_range: (initialValues?.age_range ?? "") as OnboardingValues["age_range"],
    state: initialValues?.state ?? "",
    lga: initialValues?.lga ?? "",
  };
}

function isEmpty(values: OnboardingValues) {
  return Object.values(values).every((value) => value === "");
}

export function useOnboardingForm(initialValues?: OnboardingInitialValues) {
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: buildDefaults(initialValues),
    mode: "onTouched",
  });
  const state = useWatch({ control: form.control, name: "state" });
  const prefilled = useRef(false);

  // Prefill once, when the profile arrives, without overwriting anything the
  // user has already typed. Wait for real values so an early empty render does
  // not consume the one prefill.
  useEffect(() => {
    if (prefilled.current || !initialValues) {
      return;
    }
    const defaults = buildDefaults(initialValues);
    if (isEmpty(defaults)) {
      return;
    }
    prefilled.current = true;
    if (isEmpty(form.getValues())) {
      form.reset(defaults);
    }
  }, [form, initialValues]);

  useEffect(() => {
    const lga = form.getValues("lga");
    if (lga && !getLgasForState(state).includes(lga)) {
      form.setValue("lga", "", { shouldDirty: true, shouldValidate: false });
    }
  }, [form, state]);

  return form;
}
