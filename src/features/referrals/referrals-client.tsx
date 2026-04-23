"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SendHorizonal } from "lucide-react";
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
import { referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { referralSummary } from "@/lib/ui/humanize";
import type { Referral } from "@/lib/types/backend";
import { referralSchema } from "@/lib/validation/features";

type ReferralFormValues = z.input<typeof referralSchema>;
type ReferralInput = z.output<typeof referralSchema>;

export function ReferralsClient({ mode = "referrals" }: { mode?: "referrals" | "care-plan" }) {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const referrals = useQuery({ queryKey: ["referrals"], queryFn: () => referralsApi.list() });
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
  const sectionDescription = patientView
    ? "Review doctor notes, care instructions, specialist follow-up, and the next steps in your treatment journey."
    : "Create and review referrals for the care journeys you support.";

  return (
    <Section title={sectionTitle} description={sectionDescription}>
      {userQuery.data?.role === "doctor" ? (
        <form className="grid gap-4 rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6" onSubmit={form.handleSubmit((values) => createReferral.mutate(values))}>
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#DBEAFE] text-[#2563EB]">
              <SendHorizonal className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-xl font-semibold text-[#1F2937]">Create a referral</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">Create a referral with the details another clinic or specialist will need.</p>
            </div>
          </div>
          <ErrorMessage error={createReferral.error} context="referrals" />
          {createReferral.isSuccess ? <Notice title="Referral created" tone="success">The referral has been saved and your list is up to date.</Notice> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Patient record" error={form.formState.errors.patient?.message} hint="Enter the number linked to the person receiving this referral.">
              <Input type="number" min={1} placeholder="Enter the number shared with you" {...form.register("patient")} />
            </Field>
            <Field label="Status" error={form.formState.errors.status?.message}>
              <Select {...form.register("status")}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </Select>
            </Field>
          </div>
          <Field label="Referred to" error={form.formState.errors.referred_to?.message}>
            <Input placeholder="Receiving clinic, specialist, or service" {...form.register("referred_to")} />
          </Field>
          <Field label="Notes" error={form.formState.errors.notes?.message}>
            <Textarea placeholder="Add context for the receiving provider" {...form.register("notes")} />
          </Field>
          <Button className="w-full sm:w-fit" type="submit" disabled={createReferral.isPending}>
            {createReferral.isPending ? "Creating..." : "Create referral"}
          </Button>
        </form>
      ) : patientView ? (
        <Notice title="Your doctor&apos;s next steps will appear here" tone="neutral">
          This space brings together care instructions, follow-up referrals, and any specialist guidance shared after your consultation.
        </Notice>
      ) : (
        <Notice title="Referral creation is limited to care teams" tone="neutral">Only the care team members who manage referrals can create them here.</Notice>
      )}

      <DataList<Referral>
        data={referrals.data}
        isLoading={referrals.isLoading}
        error={referrals.error}
        errorContext="referrals"
        loadingLabel="Loading your referrals..."
        emptyTitle={patientView ? "No care plan yet" : "No referrals yet"}
        empty={patientView ? "Doctor notes, instructions, and follow-up referrals will appear here when they are ready." : "Your referrals will appear here when they are available."}
        renderItem={(referral) => (
          <article key={referral.id} className="rounded-[24px] border border-white/70 bg-white p-5 shadow-[0_20px_54px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-heading text-xl font-semibold text-[#1F2937]">{patientView ? "Specialist follow-up" : referral.referred_to}</p>
                <p className="mt-2 text-sm text-slate-600">{referralSummary(userQuery.data?.role)}</p>
                {referral.notes ? <p className="mt-3 text-sm leading-7 text-slate-600">{referral.notes}</p> : null}
              </div>
              <StatusBadge value={referral.status} />
            </div>
          </article>
        )}
      />
    </Section>
  );
}
