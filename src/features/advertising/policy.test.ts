import { afterEach, describe, expect, it, vi } from "vitest";
import { advertisingContextAllowed, safePublicLocation } from "./policy";

afterEach(() => { localStorage.clear(); sessionStorage.clear(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe("homepage advertising allowlist", () => {
  it("allows only the clean canonical homepage and clean referrer", () => {
    expect(safePublicLocation("https://www.caretekk.com/", "")).toBe(true);
    expect(safePublicLocation("https://www.caretekk.com/", "https://www.caretekk.com/")).toBe(true);
    expect(safePublicLocation("https://www.caretekk.com/#services", "")).toBe(true);
  });
  it.each([
    "/login", "/dashboard", "/appointments/1", "/api/payments", "/triage", "/r/private",
    "/?fbclid=private", "/?utm_campaign=health", "/?token=private", "/#symptoms", "/privacy/advertising",
  ])("rejects %s", (path) => expect(safePublicLocation(`https://www.caretekk.com${path}`, "")).toBe(false));
  it.each(["https://www.caretekk.com/payments", "https://www.caretekk.com/?token=x", "https://facebook.com/", "not a url"])("rejects unapproved referrer %s", (referrer) => {
    expect(safePublicLocation("https://www.caretekk.com/", referrer)).toBe(false);
  });
  it("rejects other origins and credentials", () => {
    expect(safePublicLocation("https://preview.vercel.app/", "")).toBe(false);
    expect(safePublicLocation("https://user:pass@www.caretekk.com/", "")).toBe(false);
  });
  it("excludes known account/recovery contexts without reading their contents", () => {
    vi.stubGlobal("location", { href: "https://www.caretekk.com/" });
    vi.spyOn(document, "referrer", "get").mockReturnValue("");
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    expect(advertisingContextAllowed()).toBe(true);
    sessionStorage.setItem("caretekk:auth-user", "private data");
    expect(advertisingContextAllowed()).toBe(false);
    sessionStorage.clear();
    localStorage.setItem("caretekk:founder50:v1:existing", "private data");
    expect(advertisingContextAllowed()).toBe(false);
  });
  it("honors privacy signals and storage failures", () => {
    vi.stubGlobal("location", { href: "https://www.caretekk.com/" });
    vi.spyOn(document, "referrer", "get").mockReturnValue("");
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    vi.stubGlobal("navigator", { globalPrivacyControl: true });
    expect(advertisingContextAllowed()).toBe(false);
    vi.stubGlobal("navigator", {});
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(advertisingContextAllowed()).toBe(false);
  });
});
