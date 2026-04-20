"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { authApi, profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import type { DoctorProfile, PatientProfile } from "@/lib/types/backend";

export function ProfileClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const user = userQuery.data;
  const profile = useQuery({
    queryKey: ["profile", "me", user?.role],
    queryFn: () => profilesApi.me<PatientProfile | DoctorProfile>(),
    enabled: Boolean(user),
  });
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({});
  const phone = phoneDraft ?? user?.phone ?? "";
  const updateUser = useMutation({
    mutationFn: () => authApi.updateMe({ phone }),
    onSuccess: async () => {
      setPhoneDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
  const updateProfile = useMutation({
    mutationFn: () => profilesApi.updateMe(profileDraft),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["profile", "me"] }),
  });

  const isDoctor = user?.role === "doctor";

  return (
    <Section title="Profile" description="Profile fields are the exact fields exposed by `/profiles/me/`.">
      <div className="grid gap-4 lg:grid-cols-2">
        <form className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4" onSubmit={(event) => {
          event.preventDefault();
          updateUser.mutate();
        }}>
          <ErrorMessage error={updateUser.error} />
          {updateUser.isSuccess ? <Notice title="User updated" tone="success" /> : null}
          <Field label="Email">
            <Input value={user?.email || ""} disabled />
          </Field>
          <Field label="Role">
            <Input value={user?.role || ""} disabled />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(event) => setPhoneDraft(event.target.value)} />
          </Field>
          <Button className="w-fit" type="submit" disabled={updateUser.isPending}>
            Save user
          </Button>
        </form>

        <form className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4" onSubmit={(event) => {
          event.preventDefault();
          updateProfile.mutate();
        }}>
          <ErrorMessage error={updateProfile.error} />
          {updateProfile.isSuccess ? <Notice title="Profile updated" tone="success" /> : null}
          {profile.isLoading ? <p className="text-sm text-zinc-600">Loading profile...</p> : null}
          {isDoctor ? (
            <>
              <Field label="License number">
                <Input
                  defaultValue={(profile.data as DoctorProfile | undefined)?.license_no || ""}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, license_no: event.target.value }))}
                />
              </Field>
              <Field label="Clinic name">
                <Input
                  defaultValue={(profile.data as DoctorProfile | undefined)?.clinic_name || ""}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, clinic_name: event.target.value }))}
                />
              </Field>
              <Field label="Bio">
                <Textarea
                  defaultValue={(profile.data as DoctorProfile | undefined)?.bio || ""}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, bio: event.target.value }))}
                />
              </Field>
            </>
          ) : (
            <>
              <Field label="Date of birth">
                <Input
                  type="date"
                  defaultValue={(profile.data as PatientProfile | undefined)?.dob || ""}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, dob: event.target.value }))}
                />
              </Field>
              <Field label="Gender">
                <Input
                  defaultValue={(profile.data as PatientProfile | undefined)?.gender || ""}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, gender: event.target.value }))}
                />
              </Field>
              <Field label="Address">
                <Textarea
                  defaultValue={(profile.data as PatientProfile | undefined)?.address || ""}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, address: event.target.value }))}
                />
              </Field>
            </>
          )}
          <Button className="w-fit" type="submit" disabled={updateProfile.isPending}>
            Save profile
          </Button>
        </form>
      </div>
    </Section>
  );
}
