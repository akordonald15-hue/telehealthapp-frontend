import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  return forwardBackendRequest(request, "/profiles/me/");
}

export function PATCH(request: NextRequest) {
  return forwardBackendRequest(request, "/profiles/me/");
}
