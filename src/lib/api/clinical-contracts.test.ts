import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiRequest } from "./client";
import { appointmentsApi, homeCareApi, triageApi } from "./endpoints";

vi.mock("./client", () => ({ apiRequest: vi.fn(), apiList: vi.fn() }));

describe("original clinical request contracts", () => {
  beforeEach(() => vi.clearAllMocks());

  it("starts a care check with the original empty payload", () => {
    triageApi.start();
    expect(apiRequest).toHaveBeenCalledWith("/triage/start", { method: "POST" });
  });

  it("starts a conversation with only its existing session identifier", () => {
    const body = { session_id: 12 };
    triageApi.startConversation(body);
    expect(apiRequest).toHaveBeenCalledWith("/triage/conversation/start", { method: "POST", body });
  });

  it("forwards the original appointment booking payload unchanged", () => {
    const body = { doctor: 3, triage_session: 12, scheduled_at: "2030-01-01T10:00:00Z", callback_url: "https://example.test/appointments" };
    appointmentsApi.book(body);
    expect(apiRequest).toHaveBeenCalledWith("/appointments/book/", { method: "POST", body });
  });

  it("forwards the original Akwa Ibom homecare payload unchanged", () => {
    const body = { booking_source: "direct" as const, service: 2, service_zone: "eket", callback_url: "https://example.test/home-care" };
    homeCareApi.bookRequest(body);
    expect(apiRequest).toHaveBeenCalledWith("/home-care/requests/book/", { method: "POST", body });
  });
});
