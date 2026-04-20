"use client";

import { useQuery } from "@tanstack/react-query";

import { DataList } from "@/components/ui/data-list";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { auditApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
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
    <Section title="Audit" description="Audit endpoints are protected by the backend admin permission class.">
      {userQuery.data?.role !== "admin" ? (
        <Notice title="Admin role required">The backend returns 403 for non-admin users.</Notice>
      ) : (
        <DataList<AuditEvent>
          data={audit.data}
          isLoading={audit.isLoading}
          empty="No audit events returned."
          renderItem={(event) => (
            <article key={event.id} className="rounded-md border border-zinc-200 bg-white p-4">
              <p className="font-semibold text-zinc-950">{event.action}</p>
              <p className="mt-1 text-sm text-zinc-600">
                {event.object_type} #{event.object_id} · actor {event.actor ?? "system"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{formatDateTime(event.created_at)}</p>
            </article>
          )}
        />
      )}
    </Section>
  );
}
