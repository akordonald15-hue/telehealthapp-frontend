"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { Referral } from "@/lib/types/backend";
import { referralSchema } from "@/lib/validation/features";

type ReferralFormValues = z.input<typeof referralSchema>;
type ReferralInput = z.output<typeof referralSchema>;

export function ReferralsClient() {
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

  return (
    <Section title="Referrals" description="Doctors create referrals; patients and admins see records allowed by backend rules.">
      {userQuery.data?.role === "doctor" ? (
        <form className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4" onSubmit={form.handleSubmit((values) => createReferral.mutate(values))}>
          <ErrorMessage error={createReferral.error} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Patient profile ID" error={form.formState.errors.patient?.message}>
              <Input type="number" min={1} {...form.register("patient")} />
            </Field>
            <Field label="Status" error={form.formState.errors.status?.message}>
              <Select {...form.register("status")}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
              </Select>
            </Field>
          </div>
          <Field label="Referred to" error={form.formState.errors.referred_to?.message}>
            <Input {...form.register("referred_to")} />
          </Field>
          <Field label="Notes" error={form.formState.errors.notes?.message}>
            <Textarea {...form.register("notes")} />
          </Field>
          <Button className="w-fit" type="submit" disabled={createReferral.isPending}>
            Create referral
          </Button>
        </form>
      ) : (
        <Notice title="Referral creation is doctor-only">The backend rejects referral creation for non-doctor accounts.</Notice>
      )}

      <DataList<Referral>
        data={referrals.data}
        isLoading={referrals.isLoading}
        empty="No referrals returned."
        renderItem={(referral) => (
          <article key={referral.id} className="rounded-md border border-zinc-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-zinc-950">{referral.referred_to}</p>
                <p className="mt-1 text-sm text-zinc-600">
                  Patient #{referral.patient} · Doctor #{referral.doctor}
                </p>
                {referral.notes ? <p className="mt-2 text-sm text-zinc-600">{referral.notes}</p> : null}
              </div>
              <StatusBadge value={referral.status} />
            </div>
          </article>
        )}
      />
    </Section>
  );
}
