import { NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export function POST(request: NextRequest) {
  return forwardBackendRequest(request, "/auth/google/");
}
