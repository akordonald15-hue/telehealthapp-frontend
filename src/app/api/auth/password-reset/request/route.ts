import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest) {
  return forwardBackendRequest(request, "/auth/password-reset/request/");
}
