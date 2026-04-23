import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest, context: { params: Promise<{ threadId: string }> }) {
  return context.params.then(({ threadId }) =>
    forwardBackendRequest(request, `/messages/threads/${threadId}/attachments/init/`),
  );
}
