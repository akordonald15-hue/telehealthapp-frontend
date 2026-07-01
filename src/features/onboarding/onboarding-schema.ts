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

// Accepts Nigerian formats: 080..., +23480..., 23480... (10-13 digits, optional +)
const phoneRegex = /^\+?\d{10,14}$/;

export const onboardingSchema = z.object({
  // Step 1 - Basic information
  full_name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Enter a valid phone number (e.g. 08012345678)."),

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
  ["full_name", "email", "phone"],
  ["age_range", "gender"],
  ["state", "lga"],
];

export const STEP_LABELS = ["Basic Information", "Personal Information", "Location"] as const;
