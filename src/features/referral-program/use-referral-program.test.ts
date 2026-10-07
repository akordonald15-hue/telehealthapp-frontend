import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api/client";

import { hasProgrammeUnavailableCode, isProgrammeUnavailable } from "./use-referral-program";

describe("detecting an unavailable programme", () => {
  it("recognises the shape the BFF proxy actually delivers", () => {
    // Regression: the proxy replaces the body of every upstream 502/503/504 with its own
    // envelope, so the backend's code never reaches the browser. Matching on the code alone
    // meant the calm unavailable state never rendered in the real app.
    const throughProxy = new ApiError(503, {
      error: "service_unavailable",
      message: "We couldn't reach the care service right now. Please try again in a moment.",
    } as never);

    expect(isProgrammeUnavailable(throughProxy)).toBe(true);
    expect(hasProgrammeUnavailableCode(throughProxy)).toBe(false);
  });

  it("still recognises the backend's own code when it survives", () => {
    const direct = new ApiError(503, { code: "REFERRAL_PROGRAM_UNAVAILABLE" } as never);
    const enveloped = new ApiError(503, { details: { code: "REFERRAL_PROGRAM_UNAVAILABLE" } } as never);

    expect(isProgrammeUnavailable(direct)).toBe(true);
    expect(hasProgrammeUnavailableCode(direct)).toBe(true);
    expect(hasProgrammeUnavailableCode(enveloped)).toBe(true);
  });

  it("does not mistake other failures for an unavailable programme", () => {
    expect(isProgrammeUnavailable(new ApiError(401, { detail: "Not authenticated" } as never))).toBe(false);
    expect(isProgrammeUnavailable(new ApiError(400, { detail: "Bad request" } as never))).toBe(false);
    expect(isProgrammeUnavailable(new ApiError(500, { detail: "Server error" } as never))).toBe(false);
    expect(isProgrammeUnavailable(new Error("network down"))).toBe(false);
    expect(isProgrammeUnavailable(null)).toBe(false);
  });
});
