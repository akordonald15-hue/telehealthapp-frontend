"use client";

import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { providersApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";

const HEARTBEAT_INTERVAL_MS = 45_000;

export function ProviderHeartbeat() {
  const userQuery = useCurrentUser();
  const heartbeat = useMutation({
    mutationFn: providersApi.heartbeat,
  });
  const inFlightRef = useRef(false);

  useEffect(() => {
    const user = userQuery.data;
    if (!user || !["doctor", "nurse"].includes(user.role)) {
      return;
    }

    const sendHeartbeat = () => {
      if (!navigator.onLine || inFlightRef.current) {
        return;
      }
      inFlightRef.current = true;
      heartbeat.mutate(undefined, {
        onSettled: () => {
          inFlightRef.current = false;
        },
      });
    };

    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    window.addEventListener("focus", sendHeartbeat);
    window.addEventListener("online", sendHeartbeat);
    window.addEventListener("pageshow", sendHeartbeat);
    document.addEventListener("visibilitychange", sendHeartbeat);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", sendHeartbeat);
      window.removeEventListener("online", sendHeartbeat);
      window.removeEventListener("pageshow", sendHeartbeat);
      document.removeEventListener("visibilitychange", sendHeartbeat);
    };
  }, [heartbeat, userQuery.data]);

  return null;
}
