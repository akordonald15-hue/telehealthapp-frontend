import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { expect, it, vi } from "vitest";

function worker() {
  const handlers = new Map<string, (event: unknown) => void>();
  const fetch = vi.fn().mockResolvedValue(new Response("ok"));
  const caches = { open: vi.fn(), match: vi.fn() };
  runInNewContext(readFileSync("public/sw.js", "utf8"), {
    self: { location: { origin: "https://www.caretekk.com" }, addEventListener: (name: string, handler: (event: unknown) => void) => handlers.set(name, handler) },
    URL, Request, Response, fetch, caches,
  });
  return { fetch, caches, dispatch: (request: Request) => {
    const respondWith = vi.fn(); handlers.get("fetch")!({ request, respondWith }); return respondWith;
  } };
}

it.each(["https://connect.facebook.net/en_US/fbevents.js", "https://www.facebook.com/tr/?ev=PageView", "https://facebook.com/tr/?ev=PageView"])("never intercepts/caches/replays advertising request %s", (url) => {
  const sw = worker(); const request = new Request(url);
  Object.defineProperty(request, "destination", { value: "image" });
  expect(sw.dispatch(request)).not.toHaveBeenCalled();
  expect(sw.fetch).not.toHaveBeenCalled(); expect(sw.caches.open).not.toHaveBeenCalled();
});
it("does not intercept POST beacons", () => {
  const sw = worker(); expect(sw.dispatch(new Request("https://www.facebook.com/tr/", { method: "POST" }))).not.toHaveBeenCalled();
  expect(sw.caches.open).not.toHaveBeenCalled();
});
it.each(["/api/payments/", "/appointments"])("preserves no-store access for %s", async (path) => {
  const sw = worker(); const request = new Request(`https://www.caretekk.com${path}`);
  if (!path.startsWith("/api/")) Object.defineProperty(request, "mode", { value: "navigate" });
  const respondWith = sw.dispatch(request); expect(respondWith).toHaveBeenCalledOnce();
  await respondWith.mock.calls[0][0];
  expect(sw.fetch.mock.calls[0][0].cache).toBe("no-store"); expect(sw.caches.open).not.toHaveBeenCalled();
});
