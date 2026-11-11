"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, FileText } from "lucide-react";

import { DataList } from "@/components/ui/data-list";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { profilesApi, referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { referralSummary } from "@/lib/ui/humanize";
import type { CarePlan, Referral, ReferralStatus } from "@/lib/types/backend";
import { formatDateTime } from "@/lib/utils";

const referralStatuses: ReferralStatus[] = ["pending", "reviewed", "contacted", "completed", "cancelled"];

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p>
      <span className="font-semibold text-[#1F2937]">{label}:</span> {children}
    </p>
  );
}

export function ReferralsClient({ mode = "referrals" }: { mode?: "referrals" | "care-plan" }) {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const isCarePlanView = mode === "care-plan";
  const referrals = useQuery({
    queryKey: ["referrals"],
    queryFn: () => referralsApi.list(),
    enabled: !isCarePlanView,
  });
  const carePlans = useQuery({
    queryKey: ["care-plans"],
    queryFn: () => profilesApi.carePlans(),
    enabled: isCarePlanView,
  });
  const updateReferral = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReferralStatus }) => referralsApi.update(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });

  if (isCarePlanView) {
    return (
      <Section title="Care Plan" description="Doctor-written care plans from your consultations.">
        <DataList<CarePlan>
          data={carePlans.data}
          isLoading={carePlans.isLoading}
          error={carePlans.error}
          errorContext="records"
          loadingLabel="Loading your care plans..."
          emptyTitle="No care plan yet."
          empty="Your doctor-written care plan will appear here after a consultation."
          renderItem={(carePlan) => (
            <article key={carePlan.id} className="ct-surface rounded-[24px] p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#DBEAFE] text-[#2563EB]">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-lg font-semibold text-[#1F2937]">Care plan</p>
                  <div className="mt-3 grid gap-2 text-sm leading-6 text-slate-600">
                    <Detail label="Complaint summary">{carePlan.complaint_summary || "Not added"}</Detail>
                    <Detail label="Care plan">{carePlan.care_steps}</Detail>
                    <Detail label="Follow-up date">{carePlan.follow_up_date || "Not scheduled"}</Detail>
                    <Detail label="Doctor">{carePlan.doctor_name || "Caretekk doctor"}</Detail>
                    <Detail label="Consultation date">
                      {carePlan.appointment_scheduled_at ? formatDateTime(carePlan.appointment_scheduled_at) : formatDateTime(carePlan.created_at)}
                    </Detail>
                  </div>
                </div>
              </div>
            </article>
          )}
        />
      </Section>
    );
  }

  return (
    <Section
      title="Referrals"
      description={
        userQuery.data?.role === "patient"
          ? "Specialist or facility referrals created from your Caretekk consultations."
          : "Operational queue for referrals created from consultation workspaces."
      }
    >
      {userQuery.data?.role === "doctor" ? (
        <Notice title="Create referrals from a consultation" tone="neutral">
          Open a patient consultation and use Create referral so patient and appointment context are linked automatically.
        </Notice>
      ) : null}

      <ErrorMessage error={updateReferral.error} context="referrals" />
      <DataList<Referral>
        data={referrals.data}
        isLoading={referrals.isLoading}
        error={referrals.error}
        errorContext="referrals"
        loadingLabel="Loading referrals..."
        emptyTitle="No referrals yet"
        empty="Referrals will appear here when they are created from consultations."
        renderItem={(referral) => (
          <article key={referral.id} className="ct-surface rounded-[24px] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-[#ECFEFF] text-[#0F766E]">
                    <ClipboardList className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-heading text-lg font-semibold text-[#1F2937]">{referral.referred_to}</p>
                    <p className="mt-1 text-sm text-slate-500">{referralSummary(userQuery.data?.role)}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm leading-6 text-slate-600">
                  <Detail label="Reason">{referral.notes || "Details are available from the consultation record."}</Detail>
                  <Detail label="Doctor">{referral.doctor_name || "Caretekk doctor"}</Detail>
                  {userQuery.data?.role === "admin" ? <Detail label="Patient">{referral.patient_name || `Patient #${referral.patient}`}</Detail> : null}
                  <Detail label="Date">{referral.created_at ? formatDateTime(referral.created_at) : "Not available"}</Detail>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:min-w-48">
                <StatusBadge value={referral.status} />
                {userQuery.data?.role === "admin" ? (
                  <Field label="Operational status">
                    <Select
                      value={referral.status}
                      disabled={updateReferral.isPending}
                      onChange={(event) => updateReferral.mutate({ id: referral.id, status: event.target.value as ReferralStatus })}
                    >
                      {referralStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace(/_/g, " ")}
                        </option>
                      ))}
                    </Select>
                  </Field>
                ) : null}
              </div>
            </div>
          </article>
        )}
      />
    </Section>
  );
}
