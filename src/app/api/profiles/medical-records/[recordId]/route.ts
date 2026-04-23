import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest, context: { params: Promise<{ recordId: string }> }) {
  return context.params.then(({ recordId }) =>
    forwardBackendRequest(request, `/profiles/medical-records/${recordId}/`),
  );
}
