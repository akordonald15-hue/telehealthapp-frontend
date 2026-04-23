import { type NextRequest } from "next/server";

import { forwardNamespaceRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return forwardNamespaceRequest(request, context.params, "/triage");
}

export function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }) {
  return forwardNamespaceRequest(request, context.params, "/triage");
}
