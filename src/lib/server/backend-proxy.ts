import { type NextRequest } from "next/server";

function normalizeBackendApiBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return "";
  }
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
}

const backendApiBaseUrl = normalizeBackendApiBaseUrl(
  process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "",
);

if (!backendApiBaseUrl) {
  throw new Error("A backend API base URL is required via BACKEND_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL.");
}

type RouteParams = Promise<{ path?: string[] }>;
type NamespaceProxyOptions = {
  backendTrailingSlash?: boolean;
};

async function getRequestBody(request: NextRequest, headers: Headers) {
  if (["GET", "HEAD"].includes(request.method)) {
    return undefined;
  }

  const contentType = headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const payload = await request.json().catch(() => null);
    if (payload === null) {
      return undefined;
    }
    headers.set("content-type", "application/json");
    return JSON.stringify(payload);
  }

  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

export async function forwardBackendRequest(request: NextRequest, backendPath: string) {
  const targetUrl = new URL(`${backendApiBaseUrl}${backendPath}${request.nextUrl.search}`);
  const headers = new Headers(request.headers);
  const outgoingHost = targetUrl.host;
  const outgoingCookieExists = headers.has("cookie") && Boolean(headers.get("cookie")?.trim());

  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("expect");
  headers.delete("forwarded");
  headers.delete("x-forwarded-for");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-port");
  headers.delete("x-forwarded-proto");
  headers.delete("x-real-ip");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  const body = await getRequestBody(request, headers);
  if (body !== undefined) {
    init.body = body;
  }

  let response: Response;

  try {
    console.info("Backend proxy forwarding request", {
      targetUrl: targetUrl.toString(),
      method: request.method,
      outgoingHost,
      outgoingCookieExists,
    });
    response = await fetch(targetUrl, init);
  } catch (error) {
    console.error("Backend proxy request failed", {
      targetUrl: targetUrl.toString(),
      method: request.method,
      error,
    });

    return Response.json(
      {
        error: "service_unavailable",
        message: "We couldn't reach the care service right now. Please try again in a moment.",
      },
      { status: 503 },
    );
  }

  if ([502, 503, 504].includes(response.status)) {
    console.error("Backend proxy upstream error", {
      targetUrl: targetUrl.toString(),
      method: request.method,
      status: response.status,
      statusText: response.statusText,
    });

    return Response.json(
      {
        error: "service_unavailable",
        message: "We couldn't reach the care service right now. Please try again in a moment.",
      },
      { status: 503 },
    );
  }

  const responseHeaders = new Headers(response.headers);

  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.set("x-caretekk-proxy-target", targetUrl.toString());
  responseHeaders.set("x-caretekk-proxy-host", outgoingHost);
  responseHeaders.set("x-caretekk-proxy-cookie-present", outgoingCookieExists ? "yes" : "no");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function forwardNamespaceRequest(
  request: NextRequest,
  params: RouteParams,
  backendPrefix: string,
  options: NamespaceProxyOptions = {},
) {
  const resolvedParams = await params;
  const segments = resolvedParams.path ?? [];
  const suffix = segments.length ? `/${segments.join("/")}` : "";
  const normalizedSuffix = options.backendTrailingSlash
    ? suffix
      ? `${suffix}${suffix.endsWith("/") ? "" : "/"}`
      : "/"
    : suffix || "";
  return forwardBackendRequest(request, `${backendPrefix}${normalizedSuffix}`);
}
