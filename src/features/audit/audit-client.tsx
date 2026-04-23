"use client";

import { useQuery } from "@tanstack/react-query";

import { DataList } from "@/components/ui/data-list";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { auditApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { humanizeAuditAction, humanizeAuditSubtitle } from "@/lib/ui/humanize";
import type { AuditEvent } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";

export function AuditClient() {
  const userQuery = useCurrentUser();
  const audit = useQuery({
    queryKey: ["audit"],
    queryFn: () => auditApi.list(),
    enabled: userQuery.data?.role === "admin",
  });

  return (
    <Section title="Audit" description="Review important account activity and recent care operations.">
      {userQuery.data?.role !== "admin" ? (
        <Notice title="Admin access required">This area is only available to admin accounts.</Notice>
      ) : (
        <DataList<AuditEvent>
          data={audit.data}
          isLoading={audit.isLoading}
          loadingLabel="Loading activity..."
          emptyTitle="No activity yet"
          empty="There is no recent activity to show."
          renderItem={(event) => (
            <article key={event.id} className="rounded-md border border-zinc-200 bg-white p-4">
              <p className="font-semibold text-zinc-950">{humanizeAuditAction(event.action)}</p>
              <p className="mt-1 text-sm text-zinc-600">{humanizeAuditSubtitle(event)}</p>
              <p className="mt-1 text-xs text-zinc-500">{formatDateTime(event.created_at)}</p>
            </article>
          )}
        />
      )}
    </Section>
  );
}
