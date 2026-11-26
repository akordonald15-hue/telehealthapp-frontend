import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";
import { isAuthMockEnabled, mockOtpRequest } from "@/lib/server/auth-mock";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (isAuthMockEnabled()) {
    return mockOtpRequest(request);
  }
  return forwardBackendRequest(request, "/auth/otp/request/");
}
