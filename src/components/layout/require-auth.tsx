"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/lib/auth/use-auth";
import { clearTokens, hasStoredSession } from "@/lib/auth/tokens";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const userQuery = useCurrentUser();

  useEffect(() => {
    if (!hasStoredSession()) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    if (userQuery.isError) {
      clearTokens();
      router.replace("/login");
    }
  }, [router, userQuery.isError]);

  if (!hasStoredSession()) {
    return <div className="p-6 text-sm text-zinc-600">Redirecting...</div>;
  }

  if (userQuery.isLoading) {
    return <div className="p-6 text-sm text-zinc-600">Loading your workspace...</div>;
  }

  if (userQuery.isError) {
    return <div className="p-6 text-sm text-zinc-600">Redirecting...</div>;
  }

  return children;
}
