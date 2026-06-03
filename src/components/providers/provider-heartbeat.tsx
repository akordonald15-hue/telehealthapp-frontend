"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";

import { providersApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";

const HEARTBEAT_INTERVAL_MS = 60_000;

export function ProviderHeartbeat() {
  const userQuery = useCurrentUser();
  const heartbeat = useMutation({
    mutationFn: providersApi.heartbeat,
  });

  useEffect(() => {
    const user = userQuery.data;
    if (!user || !["doctor", "nurse"].includes(user.role)) {
      return;
    }

    const sendHeartbeat = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine || heartbeat.isPending) {
        return;
      }
      heartbeat.mutate();
    };

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    window.addEventListener("focus", sendHeartbeat);
    document.addEventListener("visibilitychange", sendHeartbeat);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", sendHeartbeat);
      document.removeEventListener("visibilitychange", sendHeartbeat);
    };
  }, [heartbeat, userQuery.data]);

  return null;
}
