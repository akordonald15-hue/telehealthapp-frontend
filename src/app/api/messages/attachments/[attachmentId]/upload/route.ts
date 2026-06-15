import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest, context: { params: Promise<{ attachmentId: string }> }) {
  return context.params.then(({ attachmentId }) =>
    forwardBackendRequest(request, `/messages/attachments/${attachmentId}/upload/`),
  );
}
