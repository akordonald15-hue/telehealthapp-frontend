import { type NextRequest } from "next/server";

import { forwardNamespaceRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

type Params = Promise<{ path?: string[] }>;

export function GET(request: NextRequest, { params }: { params: Params }) {
  return forwardNamespaceRequest(request, params, "/provider-ledger", { backendTrailingSlash: true });
}

export function POST(request: NextRequest, { params }: { params: Params }) {
  return forwardNamespaceRequest(request, params, "/provider-ledger", { backendTrailingSlash: true });
}
