import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/appointments",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const mocks = vi.hoisted(() => ({ me: vi.fn(), profile: vi.fn() }));

vi.mock("@/lib/api/endpoints", () => ({
  authApi: { me: mocks.me },
  profilesApi: { me: mocks.profile },
}));

import { RequireAuth } from "./require-auth";

// Stands in for a booking page holding bank-transfer details only in memory.
function TransferInProgress() {
  const [shown, setShown] = useState(false);
  return shown ? <p>Account 0123456789</p> : <button onClick={() => setShown(true)}>Pay by transfer</button>;
}

function setVisibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  document.cookie = "caretekk_session=1; Path=/";
  mocks.me.mockResolvedValue({ id: 7, email: "p@caretekk.test", phone: "", full_name: "P", role: "patient", must_change_password: false });
  mocks.profile.mockResolvedValue({ profile_complete: true });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
});

afterEach(() => {
  document.cookie = "caretekk_session=; Path=/; Max-Age=0";
  setVisibility("visible");
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RequireAuth", () => {
  it("keeps the page mounted when the patient returns after leaving to make a transfer", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <RequireAuth>
          <TransferInProgress />
        </RequireAuth>
      </QueryClientProvider>,
    );
    await userEvent.click(await screen.findByRole("button", { name: "Pay by transfer" }));
    expect(screen.getByText("Account 0123456789")).toBeInTheDocument();

    const leftAt = Date.now();
    setVisibility("hidden");
    // Longer than the 3-minute background grace: a bank app transfer takes a while.
    vi.spyOn(Date, "now").mockReturnValue(leftAt + 10 * 60 * 1000);
    // On a phone the connectivity check is still in flight when the page is shown again.
    vi.mocked(fetch).mockReturnValue(new Promise<Response>(() => undefined));
    await act(async () => {
      setVisibility("visible");
      await Promise.resolve();
    });

    expect(screen.queryByText("Preparing your Caretekk workspace")).not.toBeInTheDocument();
    expect(screen.getByText("Account 0123456789")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith("/api/auth/me/", expect.objectContaining({ cache: "no-store" }));
  });

  it("still shows the offline screen when the connection is gone on return", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <RequireAuth>
          <TransferInProgress />
        </RequireAuth>
      </QueryClientProvider>,
    );
    await screen.findByRole("button", { name: "Pay by transfer" });

    const leftAt = Date.now();
    setVisibility("hidden");
    vi.spyOn(Date, "now").mockReturnValue(leftAt + 10 * 60 * 1000);
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    await act(async () => {
      setVisibility("visible");
      await Promise.resolve();
    });

    expect(await screen.findByText(/Secure Caretekk features require internet access/)).toBeInTheDocument();
  });
});
