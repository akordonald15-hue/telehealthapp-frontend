import { type NextRequest, NextResponse } from "next/server";
import { forwardBackendRequest } from "@/lib/server/backend-proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ threadId: string; action: string }> }) {
  const { threadId, action } = await context.params;
  if (!/^\d+$/.test(threadId) || !["ready", "request-early", "agree-early", "start"].includes(action)) {
    return NextResponse.json({ detail: "Unknown consultation action." }, { status: 404 });
  }
  return forwardBackendRequest(request, `/messages/threads/${threadId}/session/${action}/`);
}
