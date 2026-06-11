import { hasStoredSession } from "@/lib/auth/tokens";

function normalizedBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_WS_BASE_URL?.replace(/\/$/, "");
  if (configured) {
    if (configured.startsWith("https://")) {
      return `wss://${configured.slice("https://".length)}`;
    }
    if (configured.startsWith("http://")) {
      return `ws://${configured.slice("http://".length)}`;
    }
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

  try {
    const url = new URL(`${base}${normalizedPath}`);
    if (url.protocol === "http:") {
      url.protocol = "ws:";
    }
    if (url.protocol === "https:") {
      url.protocol = "wss:";
    }
    if (!["ws:", "wss:"].includes(url.protocol)) {
      return null;
    }
    if (typeof window !== "undefined" && window.location.protocol === "https:" && url.protocol === "ws:") {
      url.protocol = "wss:";
    }
    return url.toString();
  } catch {
    return null;
  }
}
