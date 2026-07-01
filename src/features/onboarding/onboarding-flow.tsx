"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { ModalSheet } from "@/components/ui/modal-sheet";
import { StepProgress } from "@/components/ui/step-progress";
import { authApi, profilesApi } from "@/lib/api/endpoints";
import { authKeys, useCurrentUser } from "@/lib/auth/use-auth";
import type { PatientProfile } from "@/lib/types/backend";
import type { User } from "@/lib/types/backend";

import { StepBasicInfo } from "./steps/step-basic-info";
import { StepLocation } from "./steps/step-location";
import { StepPersonal } from "./steps/step-personal";
import {
  onboardingSchema,
  STEP_FIELDS,
  STEP_LABELS,
  type OnboardingValues,
} from "./onboarding-schema";

const TOTAL_STEPS = STEP_FIELDS.length;

const emptyValues: OnboardingValues = {
  full_name: "",
  email: "",
  phone: "",
  age_range: "" as OnboardingValues["age_range"],
  gender: "" as OnboardingValues["gender"],
  state: "",
  lga: "",
};

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
  const user = userQuery.data;

  const profileQuery = useQuery({
    queryKey: ["profile", "me", "patient"],
    queryFn: () => profilesApi.me<PatientProfile>(),
    enabled: Boolean(user),
  });

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [completed, setCompleted] = useState(false);
  const [accountFallback, setAccountFallback] = useState<Partial<User>>(() => {
    if (typeof window === "undefined") {
      return {};
    }
    return { email: window.sessionStorage.getItem("caretekk:last-login-email") || "" };
  });
  const completeTimerRef = useRef<number | null>(null);
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: emptyValues,
    mode: "onTouched",
  });

  // Prefill account fields as soon as auth is ready. The profile request can
  // arrive later, but it should never block the first Continue action.
  useEffect(() => {
    const source = {
      full_name: user?.full_name || accountFallback.full_name || "",
      email: user?.email || accountFallback.email || "",
      phone: user?.phone || accountFallback.phone || "",
    };
    if (!source.full_name && !source.email && !source.phone) return;
    const current = form.getValues();
    form.reset({
      ...current,
      full_name: current.full_name || source.full_name,
      email: source.email || current.email,
      phone: current.phone || source.phone,
    });
  }, [accountFallback.email, accountFallback.full_name, accountFallback.phone, form, user]);

  useEffect(() => {
    if (user?.email || typeof window === "undefined") return;
    let active = true;
    const loadAccount = async () => {
      try {
        const response = await fetch("/api/auth/me/", {
          credentials: "include",
          cache: "no-store",
        });
        if (!response.ok) return;
        const data = (await response.json()) as Partial<User>;
        if (active) {
          setAccountFallback((current) => ({
            ...current,
            full_name: current.full_name || data.full_name || "",
            email: current.email || data.email || "",
            phone: current.phone || data.phone || "",
          }));
        }
      } catch {
        // Visible fallback is rendered in Step 1 if email is still unavailable.
      }
    };
    void loadAccount();

    return () => {
      active = false;
    };
  }, [user?.email]);

  const prefilledProfile = useRef(false);
  useEffect(() => {
    if (prefilledProfile.current || !profileQuery.data) return;
    const profile = profileQuery.data;
    const current = form.getValues();
    form.reset({
      ...current,
      full_name: current.full_name || profile.full_name || "",
      email: current.email || profile.email || "",
      phone: current.phone || profile.phone || "",
      age_range:
        current.age_range || (profile.age_range as OnboardingValues["age_range"]) || ("" as OnboardingValues["age_range"]),
      gender:
        current.gender || (profile.gender as OnboardingValues["gender"]) || ("" as OnboardingValues["gender"]),
      state: current.state || profile.state || "",
      lga: current.lga || profile.lga || "",
    });
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
      await authApi.updateMe({ full_name: values.full_name, phone: values.phone });
      await profilesApi.updateMe<PatientProfile>({
        gender: values.gender,
        age_range: values.age_range,
        state: values.state,
        lga: values.lga,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.me });
      await queryClient.invalidateQueries({ queryKey: ["profile", "me"] });
      setCompleted(true);
      completeTimerRef.current = window.setTimeout(() => {
        onComplete?.();
      }, 1800);
    },
  });

  const goNext = async () => {
    const emailValue = user?.email || accountFallback.email || profileQuery.data?.email || form.getValues("email") || "";
    if (step === 0 && emailValue) {
      form.setValue("email", emailValue, { shouldValidate: false });
    }
    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
    const values = form.getValues();
    if (process.env.NODE_ENV !== "production") {
      console.debug("[Caretekk onboarding]", {
        currentStep: step + 1,
        validationErrors: form.formState.errors,
        emailValue: values.email,
        fullNameValue: values.full_name,
        phoneNumberValue: values.phone,
        profileLoading: profileQuery.isLoading,
        buttonDisabled: save.isPending || loading,
      });
    } else {
      console.debug("[Caretekk onboarding]", {
        currentStep: step + 1,
        hasValidationErrors: Object.keys(form.formState.errors).length > 0,
        emailPresent: Boolean(values.email),
        fullNamePresent: Boolean(values.full_name),
        phoneNumberPresent: Boolean(values.phone),
        profileLoading: profileQuery.isLoading,
        buttonDisabled: save.isPending || loading,
      });
    }
    if (!valid) return;
    if (step === 0 && !form.getValues("email")) {
      form.setError("email", {
        type: "required",
        message: "Email not found. Please log in again.",
      });
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      setDirection("next");
      setStep((current) => current + 1);
    } else {
      form.handleSubmit((values) => save.mutate(values))();
    }
  };

  const goBack = () => {
    if (step === 0) return;
    setDirection("back");
    setStep((current) => current - 1);
  };

  const isLastStep = step === TOTAL_STEPS - 1;
  const loading = userQuery.isLoading;

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
        <div className="flex items-center gap-3">
          {step > 0 ? (
            <Button type="button" variant="secondary" onClick={goBack} disabled={save.isPending}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          ) : null}
          <Button type="button" className="flex-1" onClick={goNext} disabled={save.isPending || loading}>
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
            {step === 0 ? <StepBasicInfo /> : step === 1 ? <StepPersonal /> : <StepLocation />}
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
