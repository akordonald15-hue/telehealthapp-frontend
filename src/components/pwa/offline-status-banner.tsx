"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FILE_PICKER_GRACE_EVENT, FILE_PICKER_GRACE_MS } from "@/lib/pwa/file-picker-guard";

const OFFLINE_BANNER_GRACE_MS = 30 * 1000;

export function OfflineStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const filePickerGraceUntilRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let offlineTimer: number | null = null;

    const clearOfflineTimer = () => {
      if (offlineTimer !== null) {
        window.clearTimeout(offlineTimer);
        offlineTimer = null;
      }
    };

    const syncStatus = () => {
      clearOfflineTimer();
      if (window.navigator.onLine) {
        setIsOnline(true);
        return;
      }
      const graceRemaining = Math.max(0, filePickerGraceUntilRef.current - Date.now());
      const delayMs = Math.max(OFFLINE_BANNER_GRACE_MS, graceRemaining);
      offlineTimer = window.setTimeout(() => {
        if (!window.navigator.onLine && document.visibilityState === "visible") {
          setIsOnline(false);
        }
      }, delayMs);
    };

    const handleFilePickerGrace = (event: Event) => {
      const detail = (event as CustomEvent<{ until?: number }>).detail;
      filePickerGraceUntilRef.current = Math.max(
        filePickerGraceUntilRef.current,
        typeof detail?.until === "number" ? detail.until : Date.now() + FILE_PICKER_GRACE_MS,
      );
      syncStatus();
    };

    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);
    window.addEventListener(FILE_PICKER_GRACE_EVENT, handleFilePickerGrace);

    return () => {
      clearOfflineTimer();
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
      window.removeEventListener(FILE_PICKER_GRACE_EVENT, handleFilePickerGrace);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-[18px] border border-[rgba(66,107,179,0.14)] bg-[rgba(236,243,255,0.96)] px-4 py-3 text-sm text-slate-700 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.2)]">
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-[var(--primary)]" />
      <p className="leading-6">You&apos;re offline. Secure Caretekk features require internet access.</p>
    </div>
  );
}
