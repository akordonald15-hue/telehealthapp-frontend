import { hasStoredSession } from "@/lib/auth/tokens";

function normalizedBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_WS_BASE_URL?.replace(/\/$/, "");
  if (configured) {
    return configured;
  }
  if (typeof window === "undefined") {
    return "";
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

export function buildWebSocketUrl(path: string) {
  const base = normalizedBaseUrl();
  if (!base || !hasStoredSession()) {
    return null;
  }
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
