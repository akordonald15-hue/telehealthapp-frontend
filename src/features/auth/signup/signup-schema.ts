import { z } from "zod";

import { NIGERIAN_PHONE_ERROR, normalizeNigerianPhoneInput } from "@/lib/validation/phone";

export const signupEmailSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Enter your email address.")
    .email("Enter a valid email address."),
});

export const signupAccountSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password is too short"),
  phone: z
    .string()
    .trim()
    .min(1, "Enter your phone number.")
    .refine((value) => normalizeNigerianPhoneInput(value) !== null, NIGERIAN_PHONE_ERROR),
  referral: z.string().max(32).optional(),
  terms: z.boolean().refine((value) => value, "You must accept the Terms and Privacy Agreement"),
});

export type SignupEmailInput = z.infer<typeof signupEmailSchema>;
export type SignupAccountInput = z.infer<typeof signupAccountSchema>;
