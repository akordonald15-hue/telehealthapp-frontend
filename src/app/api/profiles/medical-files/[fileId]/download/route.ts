import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  return context.params.then(({ fileId }) =>
    forwardBackendRequest(request, `/profiles/medical-files/${fileId}/download/`),
  );
}
