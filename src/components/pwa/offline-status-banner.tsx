"use client";

import { WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export function OfflineStatusBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncStatus = () => setIsOnline(window.navigator.onLine);

    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);

    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
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
