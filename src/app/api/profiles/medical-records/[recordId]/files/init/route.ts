import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest, context: { params: Promise<{ recordId: string }> }) {
  return context.params.then(({ recordId }) =>
    forwardBackendRequest(request, `/profiles/medical-records/${recordId}/files/init/`),
  );
}
