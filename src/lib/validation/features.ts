import { z } from "zod";

export const appointmentSchema = z.object({
  doctor: z.coerce.number().int().positive(),
  scheduled_at: z.string().min(1),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const messageSchema = z.object({
  body: z.string().min(1),
  attachment_url: z.string().url().optional().or(z.literal("")),
});

export const paymentInitiateSchema = z.object({
  provider: z.enum(["paystack", "flutterwave"]),
  amount: z.coerce.number().int().positive(),
  currency: z.string().max(8).default("NGN"),
  appointment_id: z.coerce.number().int().positive().optional().or(z.literal("")),
  callback_url: z.string().url(),
});

export const referralSchema = z.object({
  patient: z.coerce.number().int().positive(),
  referred_to: z.string().min(1).max(255),
  notes: z.string().optional(),
  status: z.enum(["pending", "reviewed", "contacted", "completed", "cancelled"]).default("pending"),
});

export const triageSymptomsSchema = z.object({
  symptoms: z.string().min(1),
  severity: z.enum(["mild", "moderate", "severe"]),
  duration: z.string().max(64).optional(),
  age: z.union([z.literal(""), z.coerce.number().min(0).max(120)]).optional(),
  gender: z.string().max(32).optional(),
  location: z.string().max(128).optional(),
});

export const triageMessageSchema = z.object({
  message: z.string().min(1).max(1000),
  severity: z.enum(["mild", "moderate", "severe"]).default("moderate"),
});
