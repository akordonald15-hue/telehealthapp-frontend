"use client";

import { useEffect, useSyncExternalStore } from "react";
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

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userQuery = useCurrentUser();
  const mounted = useSyncExternalStore(subscribeToClientMount, getClientMountSnapshot, getServerMountSnapshot);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (!hasStoredSession()) {
      router.replace("/login");
    }
  }, [mounted, router]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (userQuery.isError) {
      clearTokens();
      router.replace("/login");
    }
  }, [mounted, router, userQuery.isError]);

  if (!mounted || userQuery.isLoading) {
    return <div className="p-6 text-sm text-slate-600">Loading your workspace...</div>;
  }

  if (!hasStoredSession()) {
    return <div className="p-6 text-sm text-slate-600">Redirecting...</div>;
  }

  if (userQuery.isError) {
    return <div className="p-6 text-sm text-slate-600">Redirecting...</div>;
  }

  return children;
}
