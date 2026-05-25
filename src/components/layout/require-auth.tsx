"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/lib/auth/use-auth";
import { clearTokens, hasStoredSession } from "@/lib/auth/tokens";

function subscribeToClientMount() {
  return () => undefined;
}

function getClientMountSnapshot() {
  return true;
}

function getServerMountSnapshot() {
  return false;
}

const CONNECTIVITY_POLL_MS = 3000;

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const mounted = useSyncExternalStore(subscribeToClientMount, getClientMountSnapshot, getServerMountSnapshot);
  const [secureState, setSecureState] = useState<"checking" | "online" | "offline">("checking");

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

  const probeSecureConnectivity = useCallback(async () => {
    if (typeof window === "undefined") {
      return false;
    }

    if (!hasStoredSession()) {
      setSecureState("online");
      return true;
    }

    if (!window.navigator.onLine) {
      clearSensitiveState();
      setSecureState("offline");
      return false;
    }

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
        clearSensitiveState();
        setSecureState("offline");
        return false;
      }

      setSecureState("online");
      return true;
    } catch {
      clearSensitiveState();
      setSecureState("offline");
      return false;
    }
  }, [clearSensitiveState]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") {
      return;
    }

    let active = true;

    const runProbe = async (options?: { blocking?: boolean }) => {
      if (!active) {
        return;
      }
      if (options?.blocking) {
        setSecureState((current) => (current === "offline" ? "offline" : "checking"));
      }
      await probeSecureConnectivity();
    };

    const markOffline = () => {
      if (!active) {
        return;
      }
      clearSensitiveState();
      setSecureState("offline");
    };

    void runProbe({ blocking: true });

    const interval = window.setInterval(() => {
      void runProbe();
    }, CONNECTIVITY_POLL_MS);

    const handleOnline = () => {
      void runProbe({ blocking: true });
    };
    window.addEventListener("offline", markOffline);
    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleOnline);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runProbe({ blocking: true });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", markOffline);
      window.removeEventListener("focus", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearSensitiveState, mounted, probeSecureConnectivity]);

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

  if (mounted && secureState === "offline") {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(124,164,215,0.18),_transparent_28%),linear-gradient(180deg,#F8FBFF_0%,#F4F7FB_42%,#FFFFFF_100%)] px-4 py-10">
        <div className="w-full max-w-lg rounded-[28px] border border-white/80 bg-white/95 p-8 text-center shadow-[0_24px_72px_-44px_rgba(15,23,42,0.34)] backdrop-blur">
          <h1 className="font-heading text-3xl font-semibold tracking-[-0.03em] text-[#1F2937]">You&apos;re offline</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Secure Caretekk features require internet access.
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
    return <div className="p-6 text-sm text-slate-600">Loading your workspace...</div>;
  }

  if (!hasStoredSession()) {
    return <div className="p-6 text-sm text-slate-600">Redirecting...</div>;
  }

  if (userQuery.isError) {
    return <div className="p-6 text-sm text-slate-600">Redirecting...</div>;
  }

  if (userQuery.data?.must_change_password) {
    return <div className="p-6 text-sm text-slate-600">Redirecting...</div>;
  }

  return children;
}
