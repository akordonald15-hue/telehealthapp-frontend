import { type NextRequest } from "next/server";

const backendApiBaseUrl = (process.env.BACKEND_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(
  /\/$/,
  "",
);

if (!backendApiBaseUrl) {
  throw new Error("A backend API base URL is required via BACKEND_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL.");
}

type RouteParams = Promise<{ path?: string[] }>;
type NamespaceProxyOptions = {
  backendTrailingSlash?: boolean;
};

export async function forwardBackendRequest(request: NextRequest, backendPath: string) {
  const targetUrl = new URL(`${backendApiBaseUrl}${backendPath}${request.nextUrl.search}`);
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("expect");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    const body = await request.arrayBuffer();
    if (body.byteLength > 0) {
      init.body = body;
    }
  }

  let response: Response;

  try {
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
    ? `${suffix || "/"}${suffix.endsWith("/") ? "" : "/"}`
    : suffix || "";
  return forwardBackendRequest(request, `${backendPrefix}${normalizedSuffix}`);
}
