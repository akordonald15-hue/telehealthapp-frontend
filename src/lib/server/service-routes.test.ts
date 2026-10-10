import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/payments/[id]/route";
import { PATCH } from "@/app/api/referrals/[id]/route";
import { forwardBackendRequest } from "./backend-proxy";

vi.mock("./backend-proxy", () => ({ forwardBackendRequest: vi.fn() }));

describe("service detail proxies", () => {
  beforeEach(() => vi.resetAllMocks());

  it("forwards payment polling with the original authenticated request and backend response", async () => {
    const request = new NextRequest("http://localhost/api/payments/42", { headers: { cookie: "caretekk_access=test" } });
    const response = Response.json({ id: 42, status: "success", amount: "2000.00" });
    vi.mocked(forwardBackendRequest).mockResolvedValue(response);
    expect(await GET(request, { params: Promise.resolve({ id: "42" }) })).toBe(response);
    expect(forwardBackendRequest).toHaveBeenCalledWith(request, "/payments/42/");
  });

  it("forwards referral PATCH payload and preserves backend authorization refusal", async () => {
    const request = new NextRequest("http://localhost/api/referrals/7", {
      method: "PATCH", headers: { "content-type": "application/json", cookie: "caretekk_access=test" },
      body: JSON.stringify({ status: "contacted" }),
    });
    const response = Response.json({ detail: "Only admins can update referral operational status." }, { status: 403 });
    vi.mocked(forwardBackendRequest).mockResolvedValue(response);
    expect(await PATCH(request, { params: Promise.resolve({ id: "7" }) })).toBe(response);
    expect(forwardBackendRequest).toHaveBeenCalledWith(request, "/referrals/7/");
    expect(await request.json()).toEqual({ status: "contacted" });
  });
});
