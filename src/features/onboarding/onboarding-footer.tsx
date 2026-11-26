"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ds";

type OnboardingFooterProps = {
  showBack?: boolean;
  onBack?: () => void;
  onContinue?: () => void;
  continueDisabled?: boolean;
  pending?: boolean;
  submitFormId?: string;
};

// Bottom action row: Back (step 2 only) bottom-left, Continue bottom-right on
// desktop; stacked full-width buttons on mobile. When `submitFormId` is set the
// Continue button submits that form (so Enter in a field advances the step).
export function OnboardingFooter({
  showBack = false,
  onBack,
  onContinue,
  continueDisabled = false,
  pending = false,
  submitFormId,
}: OnboardingFooterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {showBack ? (
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={onBack}
          disabled={pending}
          className="w-full rounded-2xl px-4 sm:w-auto"
        >
          <ArrowLeft aria-hidden="true" className="size-5" />
          Back
        </Button>
      ) : (
        <span aria-hidden="true" className="hidden sm:block" />
      )}

      <Button
        type={submitFormId ? "submit" : "button"}
        form={submitFormId}
        size="lg"
        onClick={submitFormId ? undefined : onContinue}
        disabled={continueDisabled || pending}
        aria-busy={pending || undefined}
        className="w-full rounded-2xl px-8 sm:w-auto"
      >
        {pending ? "Saving..." : "Continue"}
      </Button>
    </div>
  );
}
