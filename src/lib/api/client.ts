import { clearTokens, getAccessToken, getRefreshToken, updateAccessToken } from "@/lib/auth/tokens";
import type { BackendErrorPayload, PaginatedResponse, TokenPair } from "@/lib/types/backend";

export class ApiError extends Error {
  status: number;
  payload: BackendErrorPayload | null;

  constructor(status: number, payload: BackendErrorPayload | null) {
    const message = extractErrorMessage(payload) || `Request failed with status ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!configuredApiBaseUrl) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is required.");
}

export const API_BASE_URL = configuredApiBaseUrl.replace(/\/$/, "");

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

function buildUrl(path: string, query?: Record<string, string | number | undefined | null>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url =
    typeof window !== "undefined"
      ? new URL(
          normalizedPath.startsWith("/api/") ? normalizedPath : `/api${normalizedPath}`,
          window.location.origin,
        )
      : new URL(`${API_BASE_URL}${normalizedPath}`);
  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export function extractErrorMessage(payload: BackendErrorPayload | null) {
  if (!payload) {
    return "";
  }
  if (payload.detail) {
    return payload.detail;
  }
  if (typeof payload.message === "string") {
    return payload.message;
  }
  if (payload.message && typeof payload.message === "object") {
    return Object.entries(payload.message as Record<string, string[] | string>)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
      .join(" ");
  }
  return payload.error || "";
}

async function refreshAccessToken() {
  const refresh = getRefreshToken();
  if (!refresh) {
    return false;
  }

  const response = await fetch(buildUrl("/auth/refresh/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!response.ok) {
    clearTokens();
    return false;
  }

  const data = (await response.json()) as TokenPair;
  updateAccessToken(data.access);
  return true;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, retryOnUnauthorized = true, headers, body, ...init } = options;
  const requestHeaders = new Headers(headers);

  if (!(body instanceof FormData) && body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: requestHeaders,
    body: body instanceof FormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401 && auth && retryOnUnauthorized && (await refreshAccessToken())) {
    return apiRequest<T>(path, { ...options, retryOnUnauthorized: false });
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(response.status, typeof data === "object" ? (data as BackendErrorPayload) : null);
  }

  return data as T;
}

export async function apiList<T>(
  path: string,
  query?: Record<string, string | number | undefined | null>,
) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const params = new URLSearchParams();

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });

  const requestPath = params.size ? `${normalizedPath}?${params.toString()}` : normalizedPath;
  return apiRequest<PaginatedResponse<T>>(requestPath);
}

export async function uploadToPresignedUrl(url: string, file: File, contentType: string) {
  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Upload failed with status ${response.status}`);
  }
}
