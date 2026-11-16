"use client";

export const CONSENT_KEY = "caretekk:advertising-consent:v1";
export const CONSENT_EVENT = "caretekk:advertising-consent";
export const CONSENT_TTL = 180 * 24 * 60 * 60 * 1000;
const BLOCK_COOKIE = "caretekk_ads_block";
export type Decision = "granted" | "denied" | "unknown";

export function revokeAdvertising() {
  try { window.fbq?.("consent", "revoke"); } catch { /* Advertising failure cannot interrupt care. */ }
}

export function readConsent(now = Date.now()): Decision {
  try {
    if (document.cookie.split(";").some((v) => v.trim().startsWith(`${BLOCK_COOKIE}=1`))) return "denied";
    const record = JSON.parse(localStorage.getItem(CONSENT_KEY) || "null");
    if (!record || record.v !== 1 || !["granted", "denied"].includes(record.advertising)
      || !Number.isFinite(record.decidedAt) || !Number.isFinite(record.expiresAt)
      || record.decidedAt > now || record.expiresAt - record.decidedAt !== CONSENT_TTL
      || record.expiresAt <= now) return "unknown";
    return record.advertising;
  } catch { return "unknown"; }
}

export function saveConsent(advertising: Exclude<Decision, "unknown">): boolean {
  // A denial cookie overrides a stale stored grant if storage becomes unavailable.
  if (advertising === "denied") {
    revokeAdvertising();
    clearAdvertisingCookies();
    try { document.cookie = `${BLOCK_COOKIE}=1; Path=/; Max-Age=15552000; SameSite=Lax; Secure`; } catch { /* Storage denial below still applies. */ }
  }
  let saved = false;
  try {
    const now = Date.now();
    const value = JSON.stringify({ v: 1, advertising, decidedAt: now, expiresAt: now + CONSENT_TTL });
    localStorage.setItem(CONSENT_KEY, value);
    saved = localStorage.getItem(CONSENT_KEY) === value;
    if (saved && advertising === "granted") document.cookie = `${BLOCK_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
  } catch { /* No persistent affirmative consent means no advertising. */ }
  window.dispatchEvent(new Event(CONSENT_EVENT));
  return saved && readConsent() === advertising;
}

export function subscribeConsent(listener: () => void) {
  const events = ["storage", CONSENT_EVENT, "focus", "pageshow", "hashchange", "popstate"];
  events.forEach((event) => window.addEventListener(event, listener));
  document.addEventListener("visibilitychange", listener);
  const timer = window.setInterval(listener, 1000);
  return () => {
    events.forEach((event) => window.removeEventListener(event, listener));
    document.removeEventListener("visibilitychange", listener);
    window.clearInterval(timer);
  };
}

export function clearAdvertisingCookies() {
  for (const name of ["_fbp", "_fbc"]) {
    for (const domain of ["", "; Domain=www.caretekk.com", "; Domain=.caretekk.com"]) {
      try { document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure${domain}`; } catch { /* Other cookies and site functionality are untouched. */ }
    }
  }
}
