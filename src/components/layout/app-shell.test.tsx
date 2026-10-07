import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pathname = { value: "/dashboard" };

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.value,
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
}));

const mocks = vi.hoisted(() => ({
  me: vi.fn(),
  threads: vi.fn(),
}));

vi.mock("@/lib/api/endpoints", () => ({
  authApi: { me: mocks.me },
  messagingApi: { threads: mocks.threads },
}));

// Not under test, and each reaches for browser APIs jsdom does not provide.
vi.mock("@/components/providers/provider-heartbeat", () => ({ ProviderHeartbeat: () => null }));
vi.mock("@/components/pwa/offline-status-banner", () => ({ OfflineStatusBanner: () => null }));
vi.mock("@/components/brand/brand-lockup", () => ({ BrandLockup: () => <span>Caretekk</span> }));

import { AppShell } from "./app-shell";

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

function signInAs(role: string) {
  document.cookie = "caretekk_session=1; Path=/";
  mocks.me.mockResolvedValue({
    id: 1,
    email: `${role}@caretekk.test`,
    phone: "",
    full_name: `Test ${role}`,
    role,
    must_change_password: false,
  });
}

beforeEach(() => {
  pathname.value = "/dashboard";
  mocks.threads.mockResolvedValue({ count: 0, next: null, previous: null, results: [] });
});

afterEach(() => {
  document.cookie = "caretekk_session=; Path=/; Max-Age=0";
  vi.clearAllMocks();
});

const sidebar = () => screen.getByRole("navigation", { name: /main navigation/i });
const bottomNav = () => screen.getByRole("navigation", { name: /bottom navigation/i });

describe("desktop navigation", () => {
  it("gives a patient a Refer & Earn entry without touching the bottom nav", async () => {
    // Refer & Earn must be reachable without typing /refer, but the mobile bottom bar is
    // deliberately five items -- so the desktop sidebar is where it lives.
    signInAs("patient");
    render(<AppShell>content</AppShell>, { wrapper });

    const link = await within(await waitFor(sidebar)).findByRole("link", { name: /refer & earn/i });
    expect(link).toHaveAttribute("href", "/refer");

    const bottom = bottomNav();
    expect(within(bottom).queryByRole("link", { name: /refer & earn/i })).not.toBeInTheDocument();
    expect(within(bottom).getAllByRole("link")).toHaveLength(5);
  });

  it.each(["doctor", "nurse", "admin"])("does not expose Refer & Earn to a %s", async (role) => {
    signInAs(role);
    render(<AppShell>content</AppShell>, { wrapper });

    const nav = await waitFor(sidebar);
    await within(nav).findByRole("link", { name: /profile/i });
    expect(within(nav).queryByRole("link", { name: /refer & earn/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /refer & earn/i })).not.toBeInTheDocument();
  });

  it("orders Refer & Earn with the other patient links rather than first", async () => {
    // `patientOrder` drives the sort; an href missing from it lands at index -1 and jumps to
    // the top of the sidebar, above Home.
    signInAs("patient");
    render(<AppShell>content</AppShell>, { wrapper });

    const nav = await waitFor(sidebar);
    const labels = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent?.trim());

    expect(labels[0]).toMatch(/care journey/i);
    expect(labels.at(-1)).toMatch(/profile/i);
    expect(labels.findIndex((l) => /refer & earn/i.test(l ?? ""))).toBeGreaterThan(0);
  });
});

describe("layout does not hide page content behind the fixed nav", () => {
  it("hides the fixed bottom nav once the desktop sidebar takes over", async () => {
    signInAs("patient");
    render(<AppShell>content</AppShell>, { wrapper });

    await waitFor(sidebar);
    // The nav is fixed to the viewport bottom, so it must not exist at widths where the
    // sidebar already provides navigation.
    expect(bottomNav().className).toContain("lg:hidden");
  });

  it("reserves bottom room with a longhand no shorthand can override", async () => {
    // Regression: `sm:py-8` sat after `pb-[calc(11rem+...)]` and won from 640px up, cutting the
    // reserve to 32px against a 91px nav -- the end of every page became unreachable.
    signInAs("patient");
    const { container } = render(<AppShell>content</AppShell>, { wrapper });

    await waitFor(sidebar);
    const main = container.querySelector("main");
    const classes = main?.className ?? "";

    expect(classes).toContain("pb-[calc(11rem+env(safe-area-inset-bottom))]");
    expect(classes).not.toMatch(/(^|\s)(sm|md|lg|xl):py-/);
  });
});
