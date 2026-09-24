import { beforeEach, describe, expect, it } from "vitest";

import {
  clearPendingReferralCode,
  looksLikeReferralCode,
  normalizeReferralCode,
  readPendingReferralCode,
  savePendingReferralCode,
} from "./referral-code-storage";

describe("referral code normalisation", () => {
  it("upper-cases and strips the separators people paste", () => {
    expect(normalizeReferralCode("donald-7k3q")).toBe("DONALD7K3Q");
    expect(normalizeReferralCode("  donald 7k3q ")).toBe("DONALD7K3Q");
  });

  it("treats missing input as empty rather than throwing", () => {
    expect(normalizeReferralCode(null)).toBe("");
    expect(normalizeReferralCode(undefined)).toBe("");
  });

  it("rejects values that cannot be a code", () => {
    expect(looksLikeReferralCode("DONALD7K3Q")).toBe(true);
    expect(looksLikeReferralCode("ab")).toBe(false);
    expect(looksLikeReferralCode("not a code!!")).toBe(false);
    expect(looksLikeReferralCode("")).toBe(false);
  });
});

describe("carrying a code through signup", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("persists a valid code and reads it back normalised", () => {
    savePendingReferralCode("donald-7k3q");
    expect(readPendingReferralCode()).toBe("DONALD7K3Q");
  });

  it("never persists junk from a mistyped link", () => {
    savePendingReferralCode("!!");
    expect(readPendingReferralCode()).toBe("");
  });

  it("clears after the account is created", () => {
    savePendingReferralCode("DONALD7K3Q");
    clearPendingReferralCode();
    expect(readPendingReferralCode()).toBe("");
  });
});
