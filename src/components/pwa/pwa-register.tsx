"use client";

import { Download, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SW_PATH = "/sw.js";

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function PwaRegister() {
  const [mounted, setMounted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showManualHint, setShowManualHint] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;
    setIsInstalled(
      window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true,
    );
  }, []);

  const supportsStandalone = useMemo(() => {
    if (!mounted || typeof window === "undefined") {
      return false;
    }
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  }, [mounted]);

  const showIosHint = useMemo(() => {
    if (!mounted || typeof window === "undefined" || supportsStandalone) {
      return false;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/crios|fxios|edgios/.test(ua);
    return isIos && isSafari;
  }, [mounted, supportsStandalone]);

  const isInstallCapableBrowser = useMemo(() => {
    if (!mounted || typeof window === "undefined" || supportsStandalone) {
      return false;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isChromiumFamily =
      /chrome|chromium|crios|edg|opr|opera|samsungbrowser/.test(ua) && !/firefox|fxios/.test(ua);
    return isChromiumFamily && "serviceWorker" in navigator;
  }, [mounted, supportsStandalone]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register(SW_PATH, { scope: "/" });
        await registration.update();
      } catch (error) {
        console.warn("Caretekk service worker registration failed.", error);
      }
    };

    void registerWorker();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowManualHint(false);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installPrompt) {
      setShowManualHint(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") {
      setInstallPrompt(null);
      setIsInstalled(true);
      return;
    }

    setInstallPrompt(null);
  }

  if (!mounted) {
    return null;
  }

  if (isInstalled || supportsStandalone) {
    return null;
  }

  if (dismissed || (!installPrompt && !showIosHint && !isInstallCapableBrowser)) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-sm rounded-[20px] border border-white/80 bg-white/95 p-3 shadow-[0_24px_72px_-40px_rgba(15,23,42,0.34)] backdrop-blur sm:max-w-md sm:p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]">
            {showIosHint ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-5 text-[#1F2937]">Install Caretekk</p>
            <p className="mt-0.5 text-xs leading-5 text-slate-600 sm:text-sm">
              {showIosHint
                ? "Use Share > Add to Home Screen."
                : showManualHint
                  ? "Use your browser menu to install."
                  : "Add Caretekk to your device."}
            </p>
          </div>
        </div>
        {showIosHint ? null : (
          <div className="mt-3 flex flex-col gap-2 sm:mt-4 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={handleInstall}
              className="lf-btn lf-btn-primary min-h-11 flex-1"
            >
              Install app
            </button>
            <button
              type="button"
              onClick={() => {
                setInstallPrompt(null);
                setShowManualHint(false);
                setDismissed(true);
              }}
              className="lf-btn lf-btn-secondary min-h-11 px-4 sm:w-auto"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
