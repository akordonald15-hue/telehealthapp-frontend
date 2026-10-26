import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { apiRequest } from "@/lib/api/client";
import { forwardNamespaceRequest } from "@/lib/server/backend-proxy";
import { GET, POST } from "@/app/api/promotions/[[...path]]/route";
import { promotionsApi } from "./api";
import { genericReason } from "./recovery";
vi.mock("@/lib/api/client", () => ({ apiRequest: vi.fn() }));
vi.mock("@/lib/server/backend-proxy", () => ({
  forwardNamespaceRequest: vi.fn(),
}));
beforeEach(() => vi.resetAllMocks());
it("uses exact verified endpoints and request bodies", async () => {
  await promotionsApi.availability();
  expect(apiRequest).toHaveBeenLastCalledWith("/promotions/founder50/", {
    cache: "no-store",
  });
  await promotionsApi.reserve("FOUNDER50", "key");
  expect(apiRequest).toHaveBeenLastCalledWith(
    "/promotions/founder50/reserve/",
    {
      method: "POST",
      body: {
        code: "FOUNDER50",
        idempotency_key: "key",
        service_type: "appointment",
      },
    },
  );
  await promotionsApi.status("id");
  expect(apiRequest).toHaveBeenLastCalledWith("/promotions/reservations/id/", {
    cache: "no-store",
  });
  await promotionsApi.release("id");
  expect(apiRequest).toHaveBeenLastCalledWith(
    "/promotions/reservations/id/release/",
    { method: "POST", body: {} },
  );
  const body = {
    doctor: 42,
    scheduled_at: "2099-01-01T12:00:00Z",
    callback_url: "https://qa.test",
    reason: genericReason,
    notes: "",
    promotion_reservation_id: "id",
    idempotency_key: "key",
  };
  await promotionsApi.book(body);
  expect(apiRequest).toHaveBeenLastCalledWith("/appointments/book/", {
    method: "POST",
    body,
  });
});
it.each([GET, POST])(
  "forwards promotion requests through authenticated namespace proxy",
  async (handler) => {
    const request = new NextRequest(
      "https://qa.test/api/promotions/founder50/",
    );
    const params = Promise.resolve({ path: ["founder50"] });
    handler(request, { params });
    expect(forwardNamespaceRequest).toHaveBeenCalledWith(
      request,
      params,
      "/promotions",
      { backendTrailingSlash: true },
    );
  },
);
