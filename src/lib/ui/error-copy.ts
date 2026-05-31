import { ApiError, extractErrorMessage } from "@/lib/api/client";

type ErrorContext =
  | "generic"
  | "auth"
  | "registration"
  | "verification"
  | "dashboard"
  | "appointments"
  | "messages"
  | "messageSend"
  | "payments"
  | "paymentCheckout"
  | "records"
  | "recordUpload"
  | "referrals"
  | "triage"
  | "profile"
  | "homeCare"
  | "nurse";

const CONTEXT_DEFAULTS: Record<ErrorContext, string> = {
  generic: "Something went wrong. Please try again.",
  auth: "We couldn't sign you in right now. Please try again.",
  registration: "We couldn't create your account right now. Please try again.",
  verification: "We couldn't verify that code right now. Please try again.",
  dashboard: "We're having trouble loading some parts of your dashboard.",
  appointments: "We couldn't load your appointments right now.",
  messages: "We couldn't load your messages right now.",
  messageSend: "Your message could not be sent right now.",
  payments: "Your payment history is temporarily unavailable.",
  paymentCheckout: "We couldn't start your payment right now.",
  records: "We couldn't load your records right now.",
  recordUpload: "Your file could not be uploaded right now.",
  referrals: "We couldn't load your referrals right now.",
  triage: "We couldn't complete that health check step right now.",
  profile: "We couldn't update your details right now.",
  homeCare: "We couldn't load your home care updates right now.",
  nurse: "We couldn't load your nurse workspace right now.",
};

const MESSAGE_OVERRIDES: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /email not verified/i, replacement: "Please verify your email before signing in." },
  {
    pattern: /invalid or expired verification code/i,
    replacement: "That verification code is invalid or has expired. Request a new code and try again.",
  },
  {
    pattern: /invalid or expired token/i,
    replacement: "That link or code is no longer valid. Request a new one and try again.",
  },
  { pattern: /no active account found with the given credentials|invalid credentials/i, replacement: "Your email or password is incorrect." },
  { pattern: /service_unavailable|bad gateway|gateway timeout/i, replacement: "We couldn't reach the sign-in service right now. Please try again in a moment." },
  { pattern: /failed to fetch/i, replacement: "We couldn't connect right now. Please try again in a moment." },
  { pattern: /network ?error/i, replacement: "We couldn't connect right now. Please check your connection and try again." },
  { pattern: /authentication credentials were not provided/i, replacement: "Please sign in again to continue." },
  { pattern: /token is invalid|token not valid|not enough segments|unauthorized/i, replacement: "Please sign in again to continue." },
  { pattern: /invalid signature/i, replacement: "We couldn't confirm that request. Please try again." },
  { pattern: /google sign-in is not configured|google sign-in is not available|google sign-in could not be verified/i, replacement: "We couldn't verify your Google account right now. Please try again or continue with email." },
  { pattern: /google email is not verified/i, replacement: "Please use a Google account with a verified email address." },
  { pattern: /method .* not allowed/i, replacement: "That action isn't available right now." },
  { pattern: /throttled|too many requests/i, replacement: "You've made a few requests in a short time. Please wait a moment and try again." },
  {
    pattern: /valid phone number in 080|phone number.*\+234|invalid phone/i,
    replacement: "Enter a valid phone number in 080... or +234... format.",
  },
];

export function getFriendlyErrorMessage(error: unknown, context: ErrorContext = "generic") {
  const fallback = CONTEXT_DEFAULTS[context];

  if (!error) {
    return fallback;
  }

  const rawMessage =
    error instanceof ApiError
      ? extractErrorMessage(error.payload) || error.message
      : error instanceof Error
        ? error.message
        : "";

  const normalized = rawMessage.trim();
  if (!normalized) {
    return fallback;
  }

  const override = MESSAGE_OVERRIDES.find(({ pattern }) => pattern.test(normalized));
  if (override) {
    return override.replacement;
  }

  if (/email/i.test(normalized) && context === "auth") {
    return "Please check your email details and try again.";
  }

  if (/password/i.test(normalized) && context === "auth") {
    return "Please check your password and try again.";
  }

  if (/appointment/i.test(normalized) && context === "appointments") {
    return "We couldn't complete that appointment request right now.";
  }

  if (/message/i.test(normalized) && (context === "messages" || context === "messageSend")) {
    return context === "messageSend"
      ? "Your message could not be sent right now."
      : "We couldn't load your messages right now.";
  }

  if (/payment|checkout|provider/i.test(normalized) && (context === "payments" || context === "paymentCheckout")) {
    return context === "paymentCheckout"
      ? "We couldn't start your payment right now."
      : "Your payment history is temporarily unavailable.";
  }

  if (/record|file|upload/i.test(normalized) && (context === "records" || context === "recordUpload")) {
    return context === "recordUpload"
      ? "Your file could not be uploaded right now."
      : "We couldn't load your records right now.";
  }

  if (/referral/i.test(normalized) && context === "referrals") {
    return "We couldn't load your referrals right now.";
  }

  if (/triage|conversation|symptom/i.test(normalized) && context === "triage") {
    return "We couldn't complete that health check step right now.";
  }

  return fallback;
}
