import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest, context: { params: Promise<{ carePlanId: string }> }) {
  return context.params.then(({ carePlanId }) =>
    forwardBackendRequest(request, `/profiles/care-plans/${carePlanId}/`),
  );
}
