"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, SendHorizonal } from "lucide-react";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { DataList } from "@/components/ui/data-list";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { profilesApi, referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { referralSummary } from "@/lib/ui/humanize";
import type { CarePlan, Referral } from "@/lib/types/backend";
import { referralSchema } from "@/lib/validation/features";

type ReferralFormValues = z.input<typeof referralSchema>;
type ReferralInput = z.output<typeof referralSchema>;

export function ReferralsClient({ mode = "referrals" }: { mode?: "referrals" | "care-plan" }) {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const referrals = useQuery({ queryKey: ["referrals"], queryFn: () => referralsApi.list() });
  const carePlans = useQuery({
    queryKey: ["care-plans"],
    queryFn: () => profilesApi.carePlans(),
    enabled: mode === "care-plan" || userQuery.data?.role === "patient",
  });
  const createReferral = useMutation({
    mutationFn: referralsApi.create,
    onSuccess: async () => {
      form.reset();
      await queryClient.invalidateQueries({ queryKey: ["referrals"] });
    },
  });
  const form = useForm<ReferralFormValues, unknown, ReferralInput>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      patient: 0,
      referred_to: "",
      notes: "",
      status: "draft",
    },
  });

  const patientView = mode === "care-plan" || userQuery.data?.role === "patient";
  const sectionTitle = patientView ? "Care Plan" : "Referrals";
  const sectionDescription = patientView ? "Doctor-written care plans from your consultations." : "Review referrals created from consultation workspaces.";

  return (
    <Section title={sectionTitle} description={sectionDescription}>
      {patientView ? (
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
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">Care plan</p>
                  {carePlan.doctor_name ? <p className="mt-1 text-sm text-slate-500">Prepared by {carePlan.doctor_name}</p> : null}
                  <div className="mt-4 grid gap-3 text-sm leading-6 text-slate-600">
                    {carePlan.complaint_summary ? <p><span className="font-semibold text-[#1F2937]">Complaint:</span> {carePlan.complaint_summary}</p> : null}
                    {carePlan.assessment_note ? <p><span className="font-semibold text-[#1F2937]">Assessment:</span> {carePlan.assessment_note}</p> : null}
                    {carePlan.care_steps ? <p><span className="font-semibold text-[#1F2937]">Care steps:</span> {carePlan.care_steps}</p> : null}
                    {carePlan.medications ? <p><span className="font-semibold text-[#1F2937]">Instructions:</span> {carePlan.medications}</p> : null}
                    {carePlan.lifestyle_advice ? <p><span className="font-semibold text-[#1F2937]">Follow-up advice:</span> {carePlan.lifestyle_advice}</p> : null}
                    {carePlan.warning_signs ? <p><span className="font-semibold text-[#1F2937]">Seek urgent care if:</span> {carePlan.warning_signs}</p> : null}
                  </div>
                </div>
              </div>
            </article>
          )}
        />
      ) : userQuery.data?.role === "doctor" ? (
        <Notice title="Create referrals from a consultation" tone="neutral">
          Open a patient consultation and use Create referral so patient and appointment context are linked automatically.
        </Notice>
      ) : userQuery.data?.role === "admin" ? (
        <form className="ct-panel grid gap-4 rounded-[28px] p-5 sm:p-6" onSubmit={form.handleSubmit((values) => createReferral.mutate(values))}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
              <SendHorizonal className="h-5 w-5" />
            </span>
            <div>
              <p className="ct-card-title text-[#1F2937]">Create a referral</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Create a referral with the details another clinic or specialist will need.</p>
            </div>
          </div>
          <ErrorMessage error={createReferral.error} context="referrals" />
          {createReferral.isSuccess ? <Notice title="Referral created" tone="success">The referral has been saved and your list is up to date.</Notice> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Patient record" error={form.formState.errors.patient?.message} hint="Use the patient record number provided in the consultation." required>
              <Input type="number" min={1} placeholder="Patient record number" {...form.register("patient")} />
            </Field>
            <Field label="Status" error={form.formState.errors.status?.message} required>
              <Select {...form.register("status")}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </Select>
            </Field>
          </div>
          <Field label="Referred to" error={form.formState.errors.referred_to?.message} required>
            <Input placeholder="Receiving clinic, specialist, or service" {...form.register("referred_to")} />
          </Field>
          <Field label="Notes" error={form.formState.errors.notes?.message} required>
            <Textarea placeholder="Add context for the receiving provider" {...form.register("notes")} />
          </Field>
          <Button className="w-full sm:w-fit" type="submit" disabled={createReferral.isPending}>
            {createReferral.isPending ? "Creating..." : "Create referral"}
          </Button>
        </form>
      ) : (
        <Notice title="Referral creation is limited to care teams" tone="neutral">Only the care team members who manage referrals can create them here.</Notice>
      )}

      {!patientView ? (
        <DataList<Referral>
          data={referrals.data}
          isLoading={referrals.isLoading}
          error={referrals.error}
          errorContext="referrals"
          loadingLabel="Loading your referrals..."
          emptyTitle="No referrals yet"
          empty="Referrals will appear here when they are created from consultations."
          renderItem={(referral) => (
            <article key={referral.id} className="ct-surface rounded-[24px] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">{referral.referred_to}</p>
                  <p className="mt-2 text-sm text-slate-600">{referralSummary(userQuery.data?.role)}</p>
                  {referral.notes ? <p className="mt-3 text-sm leading-7 text-slate-600">{referral.notes}</p> : null}
                </div>
                <StatusBadge value={referral.status} />
              </div>
            </article>
          )}
        />
      ) : null}
    </Section>
  );
}
