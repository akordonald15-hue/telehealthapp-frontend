export const NIGERIAN_PHONE_ERROR = "Enter a valid phone number in 080... or +234... format.";

export function normalizeNigerianPhoneInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  const cleaned = trimmed.replace(/[\s().-]+/g, "");

  if (/^0\d{10}$/.test(cleaned)) {
    return `+234${cleaned.slice(1)}`;
  }

  if (/^\+234\d{10}$/.test(cleaned)) {
    return cleaned;
  }

  if (/^234\d{10}$/.test(cleaned)) {
    return `+${cleaned}`;
  }

  return null;
}
