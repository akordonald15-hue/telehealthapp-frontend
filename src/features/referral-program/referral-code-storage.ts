/**
 * Carries a referral code from `/r/<code>` through the two-step signup journey.
 *
 * Mirrors the email-flow storage already used between the OTP steps: sessionStorage, so the
 * code survives the redirects of one signup attempt and disappears when the tab closes. A
 * referral code is not a secret — it is printed on marketing material — so it needs no
 * protection beyond not lingering forever.
 */

const REFERRAL_CODE_KEY = "caretekk.referral.pending_code";

/** The backend's own alphabet: upper case, unambiguous characters, up to 16. */
const CODE_PATTERN = /^[A-Z0-9]{4,16}$/;

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.sessionStorage;
  } catch {
    // Private mode or blocked storage: the journey still works, just without persistence.
    return null;
  }
}

/**
 * Normalise a code the way the backend does before lookup: upper case, no spaces or dashes.
 * This is presentation only — the backend re-normalises and remains authoritative.
 */
export function normalizeReferralCode(raw: string | null | undefined) {
  return (raw ?? "").replace(/[\s-]+/g, "").toUpperCase();
}

/** Is this plausibly a code? Used to avoid persisting obvious junk from a mistyped URL. */
export function looksLikeReferralCode(raw: string | null | undefined) {
  return CODE_PATTERN.test(normalizeReferralCode(raw));
}

export function savePendingReferralCode(raw: string) {
  const code = normalizeReferralCode(raw);
  if (!looksLikeReferralCode(code)) {
    return;
  }
  getSessionStorage()?.setItem(REFERRAL_CODE_KEY, code);
}

export function readPendingReferralCode() {
  const stored = getSessionStorage()?.getItem(REFERRAL_CODE_KEY) ?? "";
  return looksLikeReferralCode(stored) ? stored : "";
}

export function clearPendingReferralCode() {
  getSessionStorage()?.removeItem(REFERRAL_CODE_KEY);
}
