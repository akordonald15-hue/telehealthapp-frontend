"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { ModalSheet } from "@/components/ui/modal-sheet";
import { StepProgress } from "@/components/ui/step-progress";
import { ApiError } from "@/lib/api/client";
import { authApi, profilesApi } from "@/lib/api/endpoints";
import { authKeys, useCurrentUser } from "@/lib/auth/use-auth";
import type { PatientProfile } from "@/lib/types/backend";
import type { User } from "@/lib/types/backend";
import { normalizeNigerianPhoneInput } from "@/lib/validation/phone";

import { StepBasicInfo } from "./steps/step-basic-info";
import { StepLocation } from "./steps/step-location";
import { StepPersonal } from "./steps/step-personal";
import {
  getFullNameValidation,
  isValidNigerianPhone,
  onboardingSchema,
  STEP_FIELDS,
  STEP_LABELS,
  type OnboardingValues,
} from "./onboarding-schema";

const TOTAL_STEPS = STEP_FIELDS.length;
const FIELD_STEP_INDEX: Partial<Record<keyof OnboardingValues, number>> = {
  full_name: 0,
  phone: 0,
  age_range: 1,
  gender: 1,
  state: 2,
  lga: 2,
};

const emptyValues: OnboardingValues = {
  full_name: "",
  phone: "",
  age_range: "" as OnboardingValues["age_range"],
  gender: "" as OnboardingValues["gender"],
  state: "",
  lga: "",
};

const STORED_AUTH_USER_KEY = "caretekk:auth-user";

function getStoredAuthUser(): Partial<User> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    return JSON.parse(window.sessionStorage.getItem(STORED_AUTH_USER_KEY) || "{}") as Partial<User>;
  } catch {
    return {};
  }
}

function payloadMessage(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string").join(" ");
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function firstMessage(messages: string[]) {
  return messages.find(Boolean) || "Check this field and try again.";
}

type OnboardingFlowProps = {
  open?: boolean;
  /** Called after the profile is saved successfully. */
  onComplete?: () => void;
  /** Called when the user dismisses the flow (only used when `dismissible`). */
  onClose?: () => void;
  /** Onboarding is required by default; pass true to allow dismissal. */
  dismissible?: boolean;
};

export function OnboardingFlow({ open = true, onComplete, onClose, dismissible = false }: OnboardingFlowProps) {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const accountQuery = useQuery({
    queryKey: ["auth", "me", "onboarding"],
    queryFn: authApi.me,
    enabled: open,
    retry: false,
  });
  const user = userQuery.data || accountQuery.data;

  const profileQuery = useQuery({
    queryKey: ["profile", "me", "patient"],
    queryFn: () => profilesApi.me<PatientProfile>(),
    enabled: Boolean(user),
  });

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [completed, setCompleted] = useState(false);
  const [stepOneValues, setStepOneValues] = useState({ fullName: "", phoneNumber: "" });
  const [accountFallback] = useState<Partial<User>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    const storedUser = getStoredAuthUser();
    return storedUser;
  });
  const completeTimerRef = useRef<number | null>(null);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: emptyValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });
  // Prefill account fields as soon as auth is ready. The profile request can
  // arrive later, but it should never block the first Continue action.
  useEffect(() => {
    const source = {
      full_name: user?.full_name || accountFallback.full_name || "",
      phone: user?.phone || accountFallback.phone || "",
    };
    if (!source.full_name && !source.phone) return;
    const current = form.getValues();
    const nextValues = {
      ...current,
      full_name: current.full_name || source.full_name,
      phone: current.phone || source.phone,
    };
    form.reset(nextValues);
    window.setTimeout(() => {
      setStepOneValues({
        fullName: nextValues.full_name || "",
        phoneNumber: nextValues.phone || "",
      });
    }, 0);
  }, [accountFallback.full_name, accountFallback.phone, form, user]);

  useEffect(() => {
    if (!accountQuery.data) return;
    queryClient.setQueryData(authKeys.me, accountQuery.data);
  }, [accountQuery.data, queryClient]);

  const prefilledProfile = useRef(false);
  useEffect(() => {
    if (prefilledProfile.current || !profileQuery.data) return;
    const profile = profileQuery.data;
    const current = form.getValues();
    const nextValues = {
      ...current,
      full_name: current.full_name || profile.full_name || "",
      phone: current.phone || profile.phone || "",
      age_range:
        current.age_range || (profile.age_range as OnboardingValues["age_range"]) || ("" as OnboardingValues["age_range"]),
      gender:
        current.gender || (profile.gender as OnboardingValues["gender"]) || ("" as OnboardingValues["gender"]),
      state: current.state || profile.state || "",
      lga: current.lga || profile.lga || "",
    };
    form.reset(nextValues);
    window.setTimeout(() => {
      setStepOneValues({
        fullName: nextValues.full_name || "",
        phoneNumber: nextValues.phone || "",
      });
    }, 0);
    prefilledProfile.current = true;
  }, [profileQuery.data, form]);

  useEffect(() => {
    return () => {
      if (completeTimerRef.current !== null) {
        window.clearTimeout(completeTimerRef.current);
      }
    };
  }, []);

  const save = useMutation({
    mutationFn: async (values: OnboardingValues) => {
      const phone = normalizeNigerianPhoneInput(values.phone);
      if (phone === null) {
        form.setError("phone", { type: "validate", message: "Enter a valid phone number in 080... or +234... format." });
        setDirection("back");
        setStep(0);
        throw new Error("Enter a valid phone number in 080... or +234... format.");
      }

      const account = await authApi.updateMe({ full_name: values.full_name.trim(), phone });
      const profile = await profilesApi.updateMe<PatientProfile>({
        gender: values.gender,
        age_range: values.age_range,
        state: values.state,
        lga: values.lga,
      });
      return { account, profile };
    },
    onSuccess: async ({ account, profile }) => {
      queryClient.setQueryData(authKeys.me, account);
      queryClient.setQueryData(["auth", "me", "onboarding"], account);
      queryClient.setQueryData(["profile", "me", "patient"], profile);
      queryClient.setQueryData(["profile", "me", "patient", "gate"], profile);
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      setCompleted(true);
      completeTimerRef.current = window.setTimeout(() => {
        onComplete?.();
      }, 1800);
    },
    onError: (error) => {
      if (!(error instanceof ApiError) || !error.payload) {
        return;
      }

      const payload = error.payload as Record<string, unknown>;
      let firstInvalidStep: number | null = null;

      (Object.keys(FIELD_STEP_INDEX) as Array<keyof OnboardingValues>).forEach((field) => {
        const message = payloadMessage(payload[field]);
        if (!message) {
          return;
        }
        form.setError(field, { type: "server", message });
        firstInvalidStep = firstInvalidStep ?? FIELD_STEP_INDEX[field] ?? null;
      });

      if (firstInvalidStep !== null) {
        setDirection(firstInvalidStep < step ? "back" : "next");
        setStep(firstInvalidStep);
      }
    },
  });

  const fullNameValue = stepOneValues.fullName;
  const phoneNumberValue = stepOneValues.phoneNumber;
  const fullNameValidation = useMemo(() => getFullNameValidation(fullNameValue), [fullNameValue]);
  const fullNameComplete = fullNameValidation.valid;
  const phoneComplete = isValidNigerianPhone(phoneNumberValue);
  const canContinueStepOne = fullNameComplete && phoneComplete;
  const stepOneDisabled = !canContinueStepOne;

  const showFieldErrors = (messages: Partial<Record<keyof OnboardingValues, string>>) => {
    let firstInvalidStep: number | null = null;

    (Object.keys(messages) as Array<keyof OnboardingValues>).forEach((field) => {
      const message = messages[field];
      if (!message) {
        return;
      }
      form.setError(field, { type: "validate", message });
      firstInvalidStep = firstInvalidStep ?? FIELD_STEP_INDEX[field] ?? null;
    });

    if (firstInvalidStep !== null) {
      setDirection(firstInvalidStep < step ? "back" : "next");
      setStep(firstInvalidStep);
    }
  };

  const goNext = async () => {
    if (step === 0) {
      if (!canContinueStepOne) {
        if (!fullNameComplete) {
          form.setError("full_name", { type: "required", message: "Enter your first and last name." });
        }
        if (!phoneComplete) {
          form.setError("phone", { type: "required", message: "Enter a valid 11-digit Nigerian phone number." });
        }
        return;
      }

      form.clearErrors(["full_name", "phone"]);
      form.setValue("full_name", fullNameValidation.trimmed, { shouldValidate: true, shouldDirty: true });
      form.setValue("phone", phoneNumberValue, { shouldValidate: true, shouldDirty: true });
      setDirection("next");
      setStep((current) => current + 1);
      return;
    }

    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) return;
    if (step < TOTAL_STEPS - 1) {
      setDirection("next");
      setStep((current) => current + 1);
    } else {
      const parsed = onboardingSchema.safeParse(form.getValues());
      if (!parsed.success) {
        const fieldMessages: Partial<Record<keyof OnboardingValues, string>> = {};
        parsed.error.issues.forEach((issue) => {
          const field = issue.path[0] as keyof OnboardingValues | undefined;
          if (!field || !(field in FIELD_STEP_INDEX) || fieldMessages[field]) {
            return;
          }
          fieldMessages[field] = firstMessage([issue.message]);
        });
        showFieldErrors(fieldMessages);
        return;
      }
      save.mutate(parsed.data);
    }
  };

  const goBack = () => {
    if (step === 0) return;
    setDirection("back");
    setStep((current) => current - 1);
  };

  const isLastStep = step === TOTAL_STEPS - 1;

  if (completed) {
    return (
      <ModalSheet
        open={open}
        dismissible={false}
        title="Congratulations"
        description="You have completed your profile."
        className="sm:max-w-lg"
      >
        <div className="grid justify-items-center gap-5 py-4 text-center">
          <div className="relative h-24 w-24 animate-pulse">
            <span className="absolute left-1/2 top-0 h-10 w-10 -translate-x-1/2 rounded-full bg-[#DBEAFE]" />
            <span className="absolute bottom-0 left-1/2 h-10 w-10 -translate-x-1/2 rounded-full bg-[#DBEAFE]" />
            <span className="absolute left-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[#EFF6FF]" />
            <span className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-[#EFF6FF]" />
            <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#2563EB] text-white shadow-[0_18px_42px_-26px_rgba(37,99,235,0.55)]">
              <Check className="h-6 w-6" />
            </span>
          </div>
          <p className="max-w-sm text-sm leading-6 text-slate-600">
            Your care profile is ready. We are taking you to your dashboard now.
          </p>
        </div>
      </ModalSheet>
    );
  }

  return (
    <ModalSheet
      open={open}
      dismissible={dismissible}
      onClose={onClose}
      header={<StepProgress current={step + 1} total={TOTAL_STEPS} labels={[...STEP_LABELS]} />}
      title={STEP_LABELS[step]}
      description={stepDescriptions[step]}
      footer={
        <div className="grid gap-3">
          {step === 0 ? (
            <StepOneRequirements fullNameComplete={fullNameComplete} phoneComplete={phoneComplete} />
          ) : null}
          {step === 0 && stepOneDisabled ? (
            <p className="text-center text-xs font-semibold text-ash-500">Complete all required fields to continue.</p>
          ) : null}
          <div className="flex items-center gap-3">
            {step > 0 ? (
              <Button type="button" variant="secondary" onClick={goBack} disabled={save.isPending}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : null}
            <Button
              type="button"
              className={step === 0 && stepOneDisabled ? "flex-1 bg-ash-200 text-ash-500 shadow-none hover:bg-ash-200" : "flex-1"}
              onClick={(event) => {
                event.preventDefault();
                void goNext();
              }}
              disabled={step === 0 ? stepOneDisabled : save.isPending}
            >
              {isLastStep ? (
                <>
                  <Check className="h-4 w-4" />
                  {save.isPending ? "Finishing..." : "Complete profile"}
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      }
    >
      <FormProvider {...form}>
        <ErrorMessage error={save.error} context="profile" />
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void goNext();
          }}
        >
          <div key={step} className={direction === "next" ? "onboarding-step-next" : "onboarding-step-back"}>
            {step === 0 ? (
              <StepBasicInfo
                onFullNameChange={(value) =>
                  setStepOneValues((current) => ({
                    ...current,
                    fullName: value,
                  }))
                }
                onPhoneChange={(value) =>
                  setStepOneValues((current) => ({
                    ...current,
                    phoneNumber: value,
                  }))
                }
              />
            ) : step === 1 ? (
              <StepPersonal />
            ) : (
              <StepLocation />
            )}
          </div>
          {/* Allow Enter-to-submit without a visible button inside the scroll area */}
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </FormProvider>
    </ModalSheet>
  );
}

const stepDescriptions = [
  "Let's confirm the basics so we can personalise your care.",
  "A little about you to match you with the right care.",
  "Where are you located? This helps us connect you with nearby providers.",
];

function StepOneRequirements({
  fullNameComplete,
  phoneComplete,
}: {
  fullNameComplete: boolean;
  phoneComplete: boolean;
}) {
  return (
    <div className="rounded-[8px] border border-ash-200 bg-ash-50 px-4 py-3 text-sm">
      <p className="font-semibold text-ash-800">Complete the following to continue:</p>
      <div className="mt-2 grid gap-1.5 text-ash-600">
        <RequirementItem complete={fullNameComplete} completeText="Enter your first and last name" pendingText="Enter your first and last name" />
        <RequirementItem complete={phoneComplete} completeText="Valid phone number" pendingText="Enter a valid phone number" />
      </div>
    </div>
  );
}

function RequirementItem({
  complete,
  completeText,
  pendingText,
}: {
  complete: boolean;
  completeText: string;
  pendingText: string;
}) {
  return (
    <p className={complete ? "font-semibold text-primary" : "text-ash-600"}>
      <span aria-hidden="true">{complete ? "[x]" : "[ ]"}</span> {complete ? completeText : pendingText}
    </p>
  );
}
