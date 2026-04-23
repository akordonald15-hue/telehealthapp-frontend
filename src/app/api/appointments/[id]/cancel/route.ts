import { type NextRequest } from "next/server";

import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return context.params.then(({ id }) => forwardBackendRequest(request, `/appointments/${id}/cancel/`));
}
