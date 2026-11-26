"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useWatch } from "react-hook-form";

import { OnboardingScreen } from "@/components/layout/onboarding-screen";
import { ApiError, extractErrorMessage } from "@/lib/api/client";
import { authApi, profilesApi } from "@/lib/api/endpoints";
import { authKeys, readStoredAuthUser, useCurrentUser } from "@/lib/auth/use-auth";
import type { BackendErrorPayload, PatientProfile, User } from "@/lib/types/backend";

import { OnboardingFooter } from "./onboarding-footer";
import {
  hasValidFullName,
  isAgeRange,
  isGenderValue,
  isLgaForState,
  isStateName,
  STEP_ONE_FIELDS,
  STEP_TWO_FIELDS,
  type OnboardingField,
  type OnboardingValues,
} from "./onboarding-schema";
import { StepBasicInfo } from "./steps/step-basic-info";
import { StepWelcome, type StepWelcomeValues } from "./steps/step-welcome";
import { useOnboardingForm, type OnboardingInitialValues } from "./use-onboarding-form";

type OnboardingFlowProps = {
  onSubmit?: (values: OnboardingValues) => Promise<void> | void;
};

type StepNumber = 1 | 2;

const WELCOME_FIELD_MAP: Record<keyof StepWelcomeValues, OnboardingField> = {
  fullName: "full_name",
  gender: "gender",
  ageRange: "age_range",
};

const FIELD_IDS: Record<OnboardingField, string> = {
  full_name: "onboarding-full-name",
  gender: "onboarding-gender",
  age_range: "onboarding-age-range",
  state: "onboarding-state",
  lga: "onboarding-lga",
};

const FIELD_STEP: Record<OnboardingField, StepNumber> = {
  full_name: 1,
  gender: 1,
  age_range: 1,
  state: 2,
  lga: 2,
};

const SERVER_FIELD_MAP: Record<string, OnboardingField> = {
  full_name: "full_name",
  fullName: "full_name",
  gender: "gender",
  age_range: "age_range",
  ageRange: "age_range",
  state: "state",
  lga: "lga",
};

function toMessage(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((item) => toMessage(item)).filter(Boolean).join(" ");
  }
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return toMessage(record.detail ?? record.message ?? record.error ?? "");
  }
  return "";
}

function extractFieldErrors(payload: BackendErrorPayload | null): Partial<Record<OnboardingField, string>> {
  if (!payload) {
    return {};
  }

  const sources: Record<string, unknown>[] = [];
  if (payload.errors && typeof payload.errors === "object" && !Array.isArray(payload.errors)) {
    sources.push(payload.errors as Record<string, unknown>);
  }
  if (payload.message && typeof payload.message === "object" && !Array.isArray(payload.message)) {
    sources.push(payload.message as Record<string, unknown>);
  }
  sources.push(payload as unknown as Record<string, unknown>);

  const fieldErrors: Partial<Record<OnboardingField, string>> = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      const field = SERVER_FIELD_MAP[key];
      if (!field || fieldErrors[field]) {
        continue;
      }
      const message = toMessage(value);
      if (message) {
        fieldErrors[field] = message;
      }
    }
  }
  return fieldErrors;
}

function isNetworkError(error: unknown) {
  return error instanceof TypeError || (error instanceof Error && /fetch|network|offline/i.test(error.message));
}

// Two-step patient onboarding (Figma 2545:2617). Prefills from the account and
// patient profile, writes full_name to /auth/me/ and the remaining fields to
// /profiles/me/, then refreshes the gate so RequireAuth sees profile_complete.
export function OnboardingFlow({ onSubmit }: OnboardingFlowProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const patientProfile = useQuery({
    queryKey: ["profile", "me", "patient", "gate"],
    queryFn: () => profilesApi.me<PatientProfile>(),
  });
  const alreadyComplete = Boolean(patientProfile.data?.profile_complete);
  const storedUser = useMemo(() => readStoredAuthUser(), []);

  const prefilledValues = useMemo<OnboardingInitialValues>(() => {
    const profile = patientProfile.data;
    const account = userQuery.data ?? storedUser;
    const state = profile?.state && isStateName(profile.state) ? profile.state : "";
    const lga = state && profile?.lga && isLgaForState(state, profile.lga) ? profile.lga : "";

    return {
      full_name: account?.full_name?.trim() || profile?.full_name?.trim() || "",
      gender: isGenderValue(profile?.gender ?? "") ? profile?.gender : "",
      age_range: isAgeRange(profile?.age_range ?? "") ? profile?.age_range : "",
      state,
      lga,
    };
  }, [patientProfile.data, storedUser, userQuery.data]);

  useEffect(() => {
    if (alreadyComplete) {
      router.replace("/dashboard");
    }
  }, [alreadyComplete, router]);

  const form = useOnboardingForm(prefilledValues);
  const [step, setStep] = useState<StepNumber>(1);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [focusTarget, setFocusTarget] = useState<OnboardingField | null>(null);

  // Focus a field after the step (and therefore its DOM) has committed. This
  // handles server errors that belong to the other step without a same-handler
  // requestAnimationFrame race.
  useEffect(() => {
    if (!focusTarget) {
      return;
    }
    const id = FIELD_IDS[focusTarget];
    const raf = window.requestAnimationFrame(() => {
      document.getElementById(id)?.focus();
      setFocusTarget(null);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [focusTarget]);

  const fullName = useWatch({ control: form.control, name: "full_name" }) ?? "";
  const gender = useWatch({ control: form.control, name: "gender" }) ?? "";
  const ageRange = useWatch({ control: form.control, name: "age_range" }) ?? "";
  const state = useWatch({ control: form.control, name: "state" }) ?? "";
  const lga = useWatch({ control: form.control, name: "lga" }) ?? "";
  const { errors } = form.formState;

  const stepOneValid = hasValidFullName(fullName) && isGenderValue(gender) && isAgeRange(ageRange);
  const stepTwoValid = isLgaForState(state, lga);
  const isStepOne = step === 1;

  const setField = (field: OnboardingField, value: string) => {
    setSubmitError(null);
    // Validate only a field that is already showing an error so correcting it
    // clears the message without surfacing new errors while the user types.
    const hasError = Boolean(form.getFieldState(field, form.formState).error);
    form.setValue(field, value, { shouldDirty: true, shouldTouch: true, shouldValidate: hasError });
  };

  const handleWelcomeChange = (field: keyof StepWelcomeValues, value: string) => {
    setField(WELCOME_FIELD_MAP[field], value);
  };

  const handleWelcomeBlur = (field: keyof StepWelcomeValues) => {
    void form.trigger(WELCOME_FIELD_MAP[field]);
  };

  const focusField = (field: OnboardingField) => {
    window.requestAnimationFrame(() => {
      document.getElementById(FIELD_IDS[field])?.focus();
    });
  };

  const focusFirstInvalid = (fields: OnboardingField[]) => {
    const firstInvalid = fields.find((field) => form.getFieldState(field, form.formState).error);
    if (firstInvalid) {
      focusField(firstInvalid);
    }
  };

  const saveOnboarding = async (values: OnboardingValues) => {
    const fullNameValue = values.full_name.trim();
    const profilePayload = {
      gender: values.gender,
      age_range: values.age_range,
      state: values.state,
      lga: values.lga,
    };

    await authApi.updateMe({ full_name: fullNameValue });
    const updatedProfile = await profilesApi.updateMe<PatientProfile>(profilePayload);

    const account: User | undefined = userQuery.data ?? storedUser ?? undefined;
    const nextAccount = account ? { ...account, full_name: fullNameValue } : undefined;
    const nextProfile = {
      ...(patientProfile.data ?? {}),
      ...updatedProfile,
      ...profilePayload,
    } as PatientProfile;

    if (nextAccount) {
      queryClient.setQueryData(authKeys.me, nextAccount);
      queryClient.setQueryData(["auth", "me", "onboarding"], nextAccount);
    }
    queryClient.setQueryData(["profile", "me", "patient"], nextProfile);
    queryClient.setQueryData(["profile", "me", "patient", "gate"], nextProfile);

    await queryClient.invalidateQueries({ queryKey: authKeys.me });
    await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });

    const refreshedProfile = queryClient.getQueryData<PatientProfile>(["profile", "me", "patient", "gate"]);
    if (refreshedProfile && refreshedProfile.profile_complete === false) {
      throw new Error(
        "Your details were saved, but your profile is still incomplete. Please review the required fields and try again.",
      );
    }

    router.replace("/dashboard");
  };

  const handleSaveError = (error: unknown) => {
    if (error instanceof ApiError) {
      const fieldErrors = extractFieldErrors(error.payload);
      const entries = Object.entries(fieldErrors) as [OnboardingField, string][];
      if (entries.length > 0) {
        entries.forEach(([field, message]) => {
          form.setError(field, { type: "server", message });
        });
        const firstField = entries[0][0];
        setStep(FIELD_STEP[firstField]);
        setFocusTarget(firstField);
        return;
      }
      if (error.status === 401) {
        setSubmitError("Your session has expired. Please sign in again.");
        return;
      }
      setSubmitError(extractErrorMessage(error.payload) || "We could not save your details. Please try again.");
      return;
    }
    if (isNetworkError(error)) {
      setSubmitError("We couldn't reach Caretekk. Check your connection and try again.");
      return;
    }
    setSubmitError(
      error instanceof Error && error.message
        ? error.message
        : "We could not save your details. Please try again.",
    );
  };

  const handleContinue = async () => {
    if (pending) {
      return;
    }
    setSubmitError(null);
    const fields = isStepOne ? STEP_ONE_FIELDS : STEP_TWO_FIELDS;
    const valid = await form.trigger(fields, { shouldFocus: false });
    if (!valid) {
      focusFirstInvalid(fields);
      return;
    }

    if (isStepOne) {
      setStep(2);
      return;
    }

    setPending(true);
    try {
      await (onSubmit ?? saveOnboarding)(form.getValues());
    } catch (error) {
      handleSaveError(error);
    } finally {
      setPending(false);
    }
  };

  if (alreadyComplete) {
    return null;
  }

  return (
    <OnboardingScreen
      footer={
        <OnboardingFooter
          showBack={!isStepOne}
          onBack={() => {
            setSubmitError(null);
            setStep(1);
          }}
          submitFormId="onboarding-form"
          continueDisabled={pending || (isStepOne ? !stepOneValid : !stepTwoValid)}
          pending={pending}
        />
      }
    >
      <form
        id="onboarding-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void handleContinue();
        }}
      >
        {submitError ? (
          <div
            role="alert"
            className="mb-4 rounded-[12px] border border-danger-200 bg-danger-50 px-4 py-3 type-helper-text text-danger-700"
          >
            {submitError}
          </div>
        ) : null}

        {isStepOne ? (
          <StepWelcome
            values={{ fullName, gender, ageRange }}
            errors={{
              fullName: errors.full_name?.message,
              gender: errors.gender?.message,
              ageRange: errors.age_range?.message,
            }}
            onChange={handleWelcomeChange}
            onBlur={handleWelcomeBlur}
            disabled={pending}
          />
        ) : (
          <StepBasicInfo
            values={{ state, lga }}
            errors={{ state: errors.state?.message, lga: errors.lga?.message }}
            onChange={setField}
            onBlur={(field) => {
              void form.trigger(field);
            }}
            disabled={pending}
          />
        )}
      </form>
    </OnboardingScreen>
  );
}
