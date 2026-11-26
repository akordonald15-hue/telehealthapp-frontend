import { z } from "zod";

import { getLgasForState, STATE_NAMES } from "./nigeria-locations";

export const AGE_RANGES = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export const GENDER_VALUES = ["female", "male", "prefer_not_to_say"] as const;

export const GENDER_OPTIONS: ReadonlyArray<{ value: (typeof GENDER_VALUES)[number]; label: string }> = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

function getFullNameValidation(value: string) {
  const trimmed = value.trim();
  const words = trimmed ? trimmed.split(/\s+/).filter(Boolean) : [];
  const wordsAreLettersOnly = words.every((word) => /^[\p{L}]+$/u.test(word));

  return {
    trimmed,
    words,
    valid: words.length >= 2 && wordsAreLettersOnly,
  };
}

export function hasValidFullName(value: string) {
  return getFullNameValidation(value).valid;
}

export const onboardingSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(1, "Enter your full name.")
      .max(120)
      .refine(hasValidFullName, "Enter your first and last name."),
    gender: z.enum(GENDER_VALUES, { message: "Select your gender." }),
    age_range: z.enum(AGE_RANGES, { message: "Select your age range." }),
    state: z.string().trim().min(1, "Select your state."),
    lga: z.string().trim(),
  })
  .superRefine((values, ctx) => {
    if (!values.state) {
      return;
    }
    if (!STATE_NAMES.includes(values.state)) {
      ctx.addIssue({ code: "custom", path: ["state"], message: "Select a valid state." });
      return;
    }
    if (!values.lga) {
      ctx.addIssue({ code: "custom", path: ["lga"], message: "Select your local government." });
      return;
    }
    if (!getLgasForState(values.state).includes(values.lga)) {
      ctx.addIssue({ code: "custom", path: ["lga"], message: "Select a local government in your state." });
    }
  });

export type OnboardingValues = z.infer<typeof onboardingSchema>;
export type OnboardingField = keyof OnboardingValues;
type GenderValue = (typeof GENDER_VALUES)[number];
type AgeRange = (typeof AGE_RANGES)[number];

export const STEP_ONE_FIELDS: OnboardingField[] = ["full_name", "gender", "age_range"];
export const STEP_TWO_FIELDS: OnboardingField[] = ["state", "lga"];

export function isGenderValue(value: string): value is GenderValue {
  return (GENDER_VALUES as readonly string[]).includes(value);
}

export function isAgeRange(value: string): value is AgeRange {
  return (AGE_RANGES as readonly string[]).includes(value);
}

export function isStateName(value: string) {
  return STATE_NAMES.includes(value);
}

export function isLgaForState(state: string, lga: string) {
  return isStateName(state) && getLgasForState(state).includes(lga);
}
