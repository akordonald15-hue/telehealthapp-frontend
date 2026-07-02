import { z } from "zod";

export const AGE_RANGES = [
  "Under 18",
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55-64",
  "65+",
] as const;

export const GENDER_OPTIONS = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export function getFullNameValidation(value: string) {
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

export function isValidNigerianPhone(value: string) {
  const normalized = value.replace(/[\s-]/g, "");
  return /^(0[789][01]\d{8}|\+?234[789][01]\d{8})$/.test(normalized);
}

export const onboardingSchema = z.object({
  // Step 1 - Basic information
  full_name: z
    .string()
    .trim()
    .min(1, "Enter your full name.")
    .max(120)
    .refine(hasValidFullName, "Enter your first and last name."),
  phone: z
    .string()
    .trim()
    .min(1, "Enter your phone number.")
    .refine(isValidNigerianPhone, "Enter a valid 11-digit Nigerian phone number."),

  // Step 2 - Personal information
  age_range: z.enum(AGE_RANGES, { message: "Select your age range." }),
  gender: z.enum(["female", "male", "prefer_not_to_say"], { message: "Select your gender." }),

  // Step 3 - Location
  state: z.string().min(1, "Select your state."),
  lga: z.string().min(1, "Select your local government area."),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;

/** Field groups per step, used to trigger step-scoped validation before advancing. */
export const STEP_FIELDS: (keyof OnboardingValues)[][] = [
  ["full_name", "phone"],
  ["age_range", "gender"],
  ["state", "lga"],
];

export const STEP_LABELS = ["Basic Information", "Personal Information", "Location"] as const;
