import { StrictMode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AdvertisingBoundary } from "./advertising-boundary";
import { CONSENT_EVENT, saveConsent } from "./consent";

vi.mock("next/script", () => ({ default: ({ onLoad }: { onLoad: () => void }) => <button data-testid="sdk" onClick={onLoad}>Synthetic SDK load</button> }));

const reload = vi.fn();
beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  vi.stubGlobal("location", { href: "https://www.caretekk.com/", reload });
  vi.spyOn(document, "referrer", "get").mockReturnValue("");
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  reload.mockClear();
});
afterEach(() => {
  cleanup(); delete window.fbq; delete window._fbq;
  localStorage.clear(); document.cookie = "caretekk_ads_block=; Path=/; Max-Age=0";
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

function mount(enabled = true, pixelId = "123456789") {
  return render(<StrictMode><AdvertisingBoundary enabled={enabled} pixelId={pixelId}><p>Existing application content</p></AdvertisingBoundary></StrictMode>);
}
it("does not create SDK, queue or consent prompt while disabled", () => {
  saveConsent("granted"); mount(false);
  expect(screen.getByText("Existing application content")).toBeInTheDocument();
  expect(screen.queryByTestId("sdk")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(window.fbq).toBeUndefined();
});
it("never loads before consent or after rejection", () => {
  mount();
  expect(screen.queryByTestId("sdk")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reject / withdraw" }));
  expect(screen.queryByTestId("sdk")).not.toBeInTheDocument();
  expect(window.fbq).toBeUndefined();
});
it("configures only manual PageView once, with no matching data or conversion events", () => {
  mount(); fireEvent.click(screen.getByRole("button", { name: "Allow advertising" }));
  const sdk = screen.getByTestId("sdk");
  expect(window.fbq?.queue).toEqual([
    ["consent", "revoke"], ["set", "autoConfig", false, "123456789"], ["init", "123456789"], ["set", "trackSingleOnly", true, "123456789"],
  ]);
  expect(window.fbq?.disablePushState).toBe(true);
  fireEvent.click(sdk); fireEvent.click(sdk);
  vi.stubGlobal("location", { href: "https://www.caretekk.com/#services", reload });
  act(() => { window.dispatchEvent(new Event("hashchange")); });
  expect(reload).not.toHaveBeenCalled();
  expect(window.fbq?.queue?.filter((item) => item[0] === "trackSingle")).toEqual([["trackSingle", "123456789", "PageView"]]);
});
it("revokes immediately and starts a clean document on withdrawal", () => {
  saveConsent("granted"); mount(); fireEvent.click(screen.getByTestId("sdk"));
  fireEvent.click(screen.getByRole("button", { name: "Advertising preferences" }));
  fireEvent.click(screen.getByRole("button", { name: "Reject / withdraw" }));
  expect(window.fbq?.queue?.at(-1)).toEqual(["consent", "revoke"]);
  expect(screen.queryByTestId("sdk")).not.toBeInTheDocument();
  expect(reload).toHaveBeenCalledOnce();
});
it("rejects invalid IDs, private routes, attributed URLs and account contexts", () => {
  saveConsent("granted");
  const view = mount(true, "bad-id");
  expect(screen.queryByTestId("sdk")).not.toBeInTheDocument(); view.unmount();
  vi.stubGlobal("location", { href: "https://www.caretekk.com/?fbclid=private", reload });
  const attributed = mount(); expect(screen.queryByTestId("sdk")).not.toBeInTheDocument(); attributed.unmount();
  vi.stubGlobal("location", { href: "https://www.caretekk.com/dashboard", reload });
  const privateView = mount(); expect(screen.queryByTestId("sdk")).not.toBeInTheDocument(); privateView.unmount();
  vi.stubGlobal("location", { href: "https://www.caretekk.com/", reload });
  sessionStorage.setItem("caretekk:auth-user", "synthetic"); mount();
  expect(screen.queryByTestId("sdk")).not.toBeInTheDocument();
});
it("rechecks context on late SDK completion and cross-tab withdrawal", () => {
  saveConsent("granted"); mount(); const sdk = screen.getByTestId("sdk");
  localStorage.clear();
  fireEvent.click(sdk);
  expect(window.fbq?.queue?.some((item) => item[0] === "trackSingle")).toBe(false);
  act(() => { window.dispatchEvent(new Event(CONSENT_EVENT)); });
  expect(screen.queryByTestId("sdk")).not.toBeInTheDocument();
  expect(reload).toHaveBeenCalledOnce();
});
it("discards a hidden runtime when another tab withdraws consent", () => {
  const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  saveConsent("granted"); mount(); fireEvent.click(screen.getByTestId("sdk"));
  visibility.mockReturnValue("hidden");
  act(() => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(reload).not.toHaveBeenCalled();
  localStorage.clear();
  act(() => { window.dispatchEvent(new StorageEvent("storage")); });
  expect(reload).toHaveBeenCalledOnce();
});
