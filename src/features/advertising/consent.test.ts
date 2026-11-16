import { afterEach, expect, it, vi } from "vitest";
import { CONSENT_KEY, CONSENT_TTL, readConsent, saveConsent } from "./consent";

afterEach(() => { localStorage.clear(); document.cookie = "caretekk_ads_block=; Path=/; Max-Age=0"; vi.restoreAllMocks(); });

it("has no default grant, requires explicit choice and supports withdrawal", () => {
  expect(readConsent()).toBe("unknown");
  expect(saveConsent("granted")).toBe(true);
  expect(readConsent()).toBe("granted");
  saveConsent("denied");
  expect(readConsent()).toBe("denied");
  expect(localStorage.getItem(CONSENT_KEY)).not.toContain("user");
});
it("expires permission and rejects corrupt or future records", () => {
  const now = Date.now();
  saveConsent("granted");
  expect(readConsent(now + CONSENT_TTL + 1)).toBe("unknown");
  localStorage.setItem(CONSENT_KEY, "broken");
  expect(readConsent()).toBe("unknown");
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: 1, advertising: "granted", decidedAt: now + 1000, expiresAt: now + 1000 + CONSENT_TTL }));
  expect(readConsent(now)).toBe("unknown");
});
it("fails closed when storage is inaccessible", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  expect(saveConsent("granted")).toBe(false);
  expect(readConsent()).toBe("unknown");
});
it("gives a persistent denial precedence over a stale grant", () => {
  saveConsent("granted");
  vi.spyOn(document, "cookie", "get").mockReturnValue("caretekk_session=1; caretekk_ads_block=1");
  expect(readConsent()).toBe("denied");
});
