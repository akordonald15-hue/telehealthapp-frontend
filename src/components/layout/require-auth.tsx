"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";

import { profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { clearTokens, hasStoredSession } from "@/lib/auth/tokens";
import { FullPageLoader } from "@/components/ui/loaders";
import { FILE_PICKER_GRACE_EVENT, FILE_PICKER_GRACE_MS } from "@/lib/pwa/file-picker-guard";
import type { PatientProfile } from "@/lib/types/backend";

function subscribeToClientMount() {
  return () => undefined;
}

function getClientMountSnapshot() {
  return true;
}

function getServerMountSnapshot() {
  return false;
}

const CONNECTIVITY_POLL_MS = 30000;
const BACKGROUND_GRACE_MS = 3 * 60 * 1000;

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const mounted = useSyncExternalStore(subscribeToClientMount, getClientMountSnapshot, getServerMountSnapshot);
  const [secureState, setSecureState] = useState<"checking" | "online" | "offline">("checking");
  const hiddenAtRef = useRef<number | null>(null);
  const offlineSinceRef = useRef<number | null>(null);
  const filePickerGraceUntilRef = useRef(0);
  const graceTimerRef = useRef<number | null>(null);
  const patientProfileQuery = useQuery({
    queryKey: ["profile", "me", "patient", "gate"],
    queryFn: () => profilesApi.me<PatientProfile>(),
    enabled:
      mounted &&
      secureState === "online" &&
      userQuery.data?.role === "patient" &&
      !userQuery.data?.must_change_password,
  });

  const clearSensitiveState = useCallback(() => {
    queryClient.cancelQueries({
      predicate: (query) => {
        const root = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        return root !== "auth";
      },
    });
    queryClient.removeQueries({
      predicate: (query) => {
        const root = Array.isArray(query.queryKey) ? query.queryKey[0] : query.queryKey;
        return root !== "auth";
      },
    });
  }, [queryClient]);

  const inLifecycleGrace = useCallback(() => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return true;
    }
    const now = Date.now();
    if (filePickerGraceUntilRef.current > now) {
      return true;
    }
    if (hiddenAtRef.current && now - hiddenAtRef.current < BACKGROUND_GRACE_MS) {
      return true;
    }
    if (offlineSinceRef.current && now - offlineSinceRef.current < BACKGROUND_GRACE_MS) {
      return true;
    }
    return false;
  }, []);

  const markConfirmedOffline = useCallback(() => {
    clearSensitiveState();
    setSecureState("offline");
  }, [clearSensitiveState]);

  const probeSecureConnectivity = useCallback(async (options?: { destructive?: boolean }) => {
    if (typeof window === "undefined") {
      return false;
    }
    const destructive = options?.destructive ?? true;

    if (!hasStoredSession()) {
      setSecureState("online");
      return true;
    }

    if (!window.navigator.onLine) {
      offlineSinceRef.current = offlineSinceRef.current || Date.now();
      if (destructive && !inLifecycleGrace()) {
        markConfirmedOffline();
      }
      return false;
    }
    offlineSinceRef.current = null;

    try {
      const response = await fetch("/api/auth/me/", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        headers: {
          "x-caretekk-connectivity-check": "1",
        },
      });

      const isConnected = response.status < 500 || response.status === 401 || response.status === 403 || response.status === 400;
      if (!isConnected) {
        if (destructive && !inLifecycleGrace()) {
          markConfirmedOffline();
        }
        return false;
      }

      setSecureState("online");
      return true;
    } catch {
      if (destructive && !inLifecycleGrace()) {
        markConfirmedOffline();
      }
      return false;
    }
  }, [inLifecycleGrace, markConfirmedOffline]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") {
      return;
    }

    let active = true;

    const clearGraceTimer = () => {
      if (graceTimerRef.current !== null) {
        window.clearTimeout(graceTimerRef.current);
        graceTimerRef.current = null;
      }
    };

    const runProbe = async (options?: { blocking?: boolean; destructive?: boolean }) => {
      if (!active) {
        return;
      }
      if (document.visibilityState === "hidden") {
        return;
      }
      const destructive = options?.destructive ?? !inLifecycleGrace();
      if (options?.blocking && destructive) {
        setSecureState((current) => (current === "offline" ? "offline" : "checking"));
      }
      await probeSecureConnectivity({ destructive });
    };

    const scheduleGraceProbe = (delayMs = BACKGROUND_GRACE_MS) => {
      if (!active) {
        return;
      }
      clearGraceTimer();
      graceTimerRef.current = window.setTimeout(() => {
        if (!active) {
          return;
        }
        void runProbe({ destructive: true });
      }, delayMs);
    };

    void runProbe({ blocking: true });

    const interval = window.setInterval(() => {
      void runProbe({ destructive: !inLifecycleGrace() });
    }, CONNECTIVITY_POLL_MS);

    const handleOnline = () => {
      offlineSinceRef.current = null;
      void runProbe({ blocking: true, destructive: false });
    };

    const markOffline = () => {
      offlineSinceRef.current = Date.now();
      scheduleGraceProbe(BACKGROUND_GRACE_MS);
    };

    window.addEventListener("offline", markOffline);
    window.addEventListener("online", handleOnline);
    const handleFocus = () => {
      void runProbe({ destructive: !inLifecycleGrace() });
    };
    window.addEventListener("focus", handleFocus);

    const handleFilePickerGrace = (event: Event) => {
      const detail = (event as CustomEvent<{ until?: number }>).detail;
      filePickerGraceUntilRef.current = Math.max(
        filePickerGraceUntilRef.current,
        typeof detail?.until === "number" ? detail.until : Date.now() + FILE_PICKER_GRACE_MS,
      );
      scheduleGraceProbe(Math.max(1000, filePickerGraceUntilRef.current - Date.now()));
    };

    window.addEventListener(FILE_PICKER_GRACE_EVENT, handleFilePickerGrace);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        scheduleGraceProbe(BACKGROUND_GRACE_MS);
        return;
      }
      const wasHiddenAt = hiddenAtRef.current;
      const stayedWithinGrace = !wasHiddenAt || Date.now() - wasHiddenAt < BACKGROUND_GRACE_MS;
      hiddenAtRef.current = null;
      if (!stayedWithinGrace && !window.navigator.onLine) {
        markConfirmedOffline();
        return;
      }
      void runProbe({ blocking: !stayedWithinGrace, destructive: !stayedWithinGrace && !inLifecycleGrace() });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      clearGraceTimer();
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener(FILE_PICKER_GRACE_EVENT, handleFilePickerGrace);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [inLifecycleGrace, markConfirmedOffline, mounted, probeSecureConnectivity]);

  useEffect(() => {
    if (!mounted || secureState !== "online") {
      return;
    }
    if (!hasStoredSession()) {
      router.replace("/login");
    }
  }, [mounted, router, secureState]);

  useEffect(() => {
    if (!mounted || secureState !== "online") {
      return;
    }
    if (userQuery.isError) {
      clearTokens();
      router.replace("/login");
    }
  }, [mounted, router, secureState, userQuery.isError]);

  useEffect(() => {
    if (!mounted || secureState !== "online" || !userQuery.data?.must_change_password) {
      return;
    }
    router.replace("/change-password");
  }, [mounted, router, secureState, userQuery.data?.must_change_password]);

  useEffect(() => {
    if (
      !mounted ||
      secureState !== "online" ||
      userQuery.data?.role !== "patient" ||
      userQuery.data?.must_change_password ||
      patientProfileQuery.isLoading ||
      patientProfileQuery.isError ||
      patientProfileQuery.data?.profile_complete ||
      pathname === "/onboarding"
    ) {
      return;
    }
    router.replace("/onboarding");
  }, [
    mounted,
    patientProfileQuery.data?.profile_complete,
    patientProfileQuery.isError,
    patientProfileQuery.isLoading,
    pathname,
    router,
    secureState,
    userQuery.data?.must_change_password,
    userQuery.data?.role,
  ]);

  if (mounted && secureState === "offline") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(124,164,215,0.18),_transparent_28%),linear-gradient(180deg,#F8FBFF_0%,#F4F7FB_42%,#FFFFFF_100%)] px-4 py-10">
        <div className="w-full max-w-lg rounded-[28px] border border-white/80 bg-white/95 p-8 text-center shadow-[0_24px_72px_-44px_rgba(15,23,42,0.34)] backdrop-blur">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-[#1F2937]">You&apos;re offline</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            You&apos;re offline. Secure Caretekk features require internet access.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Chat, payments, live nurse tracking, and dashboard data will resume when your connection returns.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/" className="lf-btn lf-btn-primary flex-1">
              Go to home
            </Link>
            <Link href="/offline" className="lf-btn lf-btn-secondary flex-1">
              Open offline page
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!mounted || secureState === "checking" || userQuery.isLoading) {
    return (
      <FullPageLoader
        title="Preparing your Caretekk workspace"
        subtitle="We are checking your access and loading the right dashboard."
      />
    );
  }

  if (!hasStoredSession()) {
    return <FullPageLoader title="Securing your session" subtitle="Taking you to the right sign-in step." />;
  }

  if (userQuery.isError) {
    return <FullPageLoader title="Securing your session" subtitle="Refreshing access before we continue." />;
  }

  if (userQuery.data?.must_change_password) {
    return <FullPageLoader title="Securing your session" subtitle="Preparing your password update." />;
  }

  if (
    userQuery.data?.role === "patient" &&
    patientProfileQuery.isLoading &&
    secureState === "online"
  ) {
    return (
      <FullPageLoader
        title="Preparing your Caretekk profile"
        subtitle="We are checking the details needed for safe care."
      />
    );
  }

  if (
    userQuery.data?.role === "patient" &&
    patientProfileQuery.data &&
    !patientProfileQuery.data.profile_complete &&
    pathname !== "/onboarding"
  ) {
    return (
      <FullPageLoader
        title="Preparing your profile setup"
        subtitle="Taking you to the required onboarding steps."
      />
    );
  }

  return children;
}
