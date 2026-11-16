"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { clearAdvertisingCookies, readConsent, revokeAdvertising, subscribeConsent } from "./consent";
import { advertisingContextAllowed } from "./policy";
import { AdvertisingPreferences } from "./preferences";

type Pixel = ((...args: unknown[]) => void) & { queue?: unknown[][]; push?: Pixel; loaded?: boolean; version?: string; disablePushState?: boolean; callMethod?: (...args: unknown[]) => void };
declare global { interface Window { fbq?: Pixel; _fbq?: Pixel } }

function allowedSnapshot() { return readConsent() === "granted" && advertisingContextAllowed(); }
function privacySnapshot() {
  // A denial must notify React even if a hidden tab was already ineligible to send events.
  return `${readConsent()}:${advertisingContextAllowed(false) ? "safe" : "blocked"}:${document.visibilityState}`;
}

export function AdvertisingBoundary({ children, enabled, pixelId }: { children: React.ReactNode; enabled: boolean; pixelId: string }) {
  const privacyState = useSyncExternalStore(subscribeConsent, privacySnapshot, () => "unknown:blocked:hidden");
  const allowed = privacyState === "granted:safe:visible";
  const sent = useRef(false);
  const loaded = useRef(false);
  const configured = enabled && /^\d{5,30}$/.test(pixelId);
  const initialize = useCallback(() => {
    loaded.current = true;
    if (!configured || !window.fbq || !allowedSnapshot() || sent.current) return;
    try {
      window.fbq?.("consent", "grant");
      window.fbq?.("trackSingle", pixelId, "PageView");
      sent.current = true;
    } catch { /* Advertising must never interrupt the site. No automatic retry. */ }
  }, [configured, pixelId]);

  useEffect(() => {
    if (configured && allowed) {
      // Official SDK queue, established only after explicit persisted consent.
      if (!window.fbq) {
        const pixel: Pixel = function (...args: unknown[]) {
          if (pixel.callMethod) pixel.callMethod(...args); else pixel.queue?.push(args);
        };
        pixel.queue = []; pixel.push = pixel; pixel.loaded = true; pixel.version = "2.0";
        // The SDK's SPA observer is independent of autoConfig. Do not let it instrument Next's history.
        pixel.disablePushState = true;
        window.fbq = pixel; window._fbq = pixel;
        pixel("consent", "revoke");
        pixel("set", "autoConfig", false, pixelId);
        pixel("init", pixelId);
        // Scope this Pixel to explicit trackSingle calls, including SDK-generated global PageViews.
        pixel("set", "trackSingleOnly", true, pixelId);
      }
      if (loaded.current) initialize();
    } else if (window.fbq) {
      revokeAdvertising();
      if (configured && readConsent() === "granted" && advertisingContextAllowed(false)) return;
      clearAdvertisingCookies();
      // Removing a script tag cannot unload third-party code. Start a clean document.
      window.location.reload();
    }
  }, [allowed, configured, pixelId, initialize, privacyState]);

  useEffect(() => {
    function leave() { revokeAdvertising(); }
    function restore(event: PageTransitionEvent) { if (event.persisted && window.fbq) window.location.reload(); }
    window.addEventListener("pagehide", leave);
    window.addEventListener("pageshow", restore);
    return () => { window.removeEventListener("pagehide", leave); window.removeEventListener("pageshow", restore); };
  }, []);

  return <>{children}
    {configured && <div className="px-5 py-3 text-center text-sm"><AdvertisingPreferences prompt /></div>}
    {configured && allowed && <Script id="caretekk-meta-pixel" src="https://connect.facebook.net/en_US/fbevents.js" strategy="afterInteractive" referrerPolicy="no-referrer" onLoad={initialize} onError={revokeAdvertising} />}
  </>;
}
