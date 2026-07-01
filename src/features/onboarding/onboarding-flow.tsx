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
  const form = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: emptyValues,
    mode: "onTouched",
  });

  // Prefill once account + profile data is available.
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current || !user || profileQuery.isLoading) return;
    const profile = profileQuery.data;
    form.reset({
      full_name: user.full_name ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      age_range: (profile?.age_range as OnboardingValues["age_range"]) ?? ("" as OnboardingValues["age_range"]),
      gender: (profile?.gender as OnboardingValues["gender"]) ?? ("" as OnboardingValues["gender"]),
      state: profile?.state ?? "",
      lga: profile?.lga ?? "",
    });
    prefilled.current = true;
  }, [user, profileQuery.data, profileQuery.isLoading, form]);

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
      onComplete?.();
    },
  });

  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) return;
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
  const loading = userQuery.isLoading || profileQuery.isLoading;

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
                {save.isPending ? "Finishing..." : "Finish"}
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
