import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  email: z.string().email(),
  phone: z.string().max(32).optional(),
  password: z.string().min(8),
});

export const emailSchema = z.object({
  email: z.string().email(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1).max(128),
  new_password: z.string().min(8),
});

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(8, "Current password is required."),
    new_password: z.string().min(8, "Use at least 8 characters."),
    confirm_password: z.string().min(8, "Confirm your new password."),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match.",
  });

export const emailVerifySchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>;
export type EmailVerifyInput = z.infer<typeof emailVerifySchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
