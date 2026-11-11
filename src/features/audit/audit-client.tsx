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
            <article key={event.id} className="rounded-[22px] border border-white/70 bg-white p-5 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.45)]">
              <p className="font-semibold text-[#1F2937]">{humanizeAuditAction(event.action)}</p>
              <p className="mt-1 text-sm text-slate-600">{humanizeAuditSubtitle(event)}</p>
              <p className="mt-1 text-xs text-slate-500">{formatDateTime(event.created_at)}</p>
            </article>
          )}
        />
      )}
    </Section>
  );
}
