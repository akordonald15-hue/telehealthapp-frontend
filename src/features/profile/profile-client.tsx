"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { authApi, profilesApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { NIGERIA_STATE_LGAS, NIGERIA_STATES } from "@/lib/nigeria-locations";
import type { DoctorProfile, NurseProfile, PatientProfile } from "@/lib/types/backend";

export function ProfileClient() {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const user = userQuery.data;
  const profile = useQuery({
    queryKey: ["profile", "me", user?.role],
    queryFn: () => profilesApi.me<PatientProfile | DoctorProfile | NurseProfile>(),
    enabled: Boolean(user),
  });
  const [phoneDraft, setPhoneDraft] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [profileDraft, setProfileDraft] = useState<Record<string, string>>({});
  const phone = phoneDraft ?? user?.phone ?? "";
  const fullName = nameDraft ?? user?.full_name ?? "";
  const patientProfile = profile.data as PatientProfile | undefined;
  const selectedState = profileDraft.state ?? patientProfile?.state ?? "";
  const lgaOptions = selectedState ? (NIGERIA_STATE_LGAS[selectedState] ?? []) : [];
  const updateUser = useMutation({
    mutationFn: () => authApi.updateMe({ phone, full_name: fullName }),
    onSuccess: async () => {
      setPhoneDraft(null);
      setNameDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
  const updateProfile = useMutation({
    mutationFn: () => profilesApi.updateMe(profileDraft),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["profile", "me"] }),
  });

  const isDoctor = user?.role === "doctor";
  const isNurse = user?.role === "nurse";

  return (
    <Section title="Profile">
      <div className="grid gap-4 lg:grid-cols-2">
        <form className="ct-panel grid gap-4 rounded-[28px] p-5 sm:p-6" onSubmit={(event) => {
          event.preventDefault();
          updateUser.mutate();
        }}>
          <div>
            <h2 className="ct-card-title text-[#1F2937]">Account details</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Your account information.</p>
          </div>
          <ErrorMessage error={updateUser.error} context="profile" />
          {updateUser.isSuccess ? <Notice title="Details saved" tone="success" /> : null}
          <Field label="Full Name">
            <Input value={fullName} onChange={(event) => setNameDraft(event.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={user?.email || ""} disabled />
          </Field>
          <Field label="Phone">
            <Input value={phone} onChange={(event) => setPhoneDraft(event.target.value)} />
          </Field>
          <Button className="w-fit" type="submit" disabled={updateUser.isPending}>
            Save details
          </Button>
        </form>

        <form className="ct-panel grid gap-4 rounded-[28px] p-5 sm:p-6" onSubmit={(event) => {
          event.preventDefault();
          updateProfile.mutate();
        }}>
          <div>
            <h2 className="ct-card-title text-[#1F2937]">Profile information</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Keep your details up to date.</p>
          </div>
          <ErrorMessage error={updateProfile.error} context="profile" />
          {updateProfile.isSuccess ? <Notice title="Profile saved" tone="success" /> : null}
          {profile.isLoading ? <InlineLoader compact label="Loading your profile" /> : null}
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
          ) : isNurse ? (
            <>
              <Field label="License number">
                <Input
                  value={(profile.data as NurseProfile | undefined)?.license_no || "Assigned by Caretekk"}
                  disabled
                  readOnly
                />
              </Field>
              <Field label="Service type">
                <Input
                  defaultValue={(profile.data as NurseProfile | undefined)?.service_type || ""}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, service_type: event.target.value }))}
                />
              </Field>
              <Field label="Base area">
                <Textarea
                  defaultValue={(profile.data as NurseProfile | undefined)?.base_address || ""}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, base_address: event.target.value }))}
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
                <Select
                  defaultValue={(profile.data as PatientProfile | undefined)?.gender || ""}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, gender: event.target.value }))}
                >
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </Select>
              </Field>
              <Field label="State">
                <Select
                  value={selectedState}
                  onChange={(event) => {
                    const state = event.target.value;
                    setProfileDraft((draft) => ({ ...draft, state, lga: "" }));
                  }}
                >
                  <option value="">Select state</option>
                  {NIGERIA_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Local government area">
                <Select
                  value={profileDraft.lga ?? patientProfile?.lga ?? ""}
                  disabled={!selectedState}
                  onChange={(event) => setProfileDraft((draft) => ({ ...draft, lga: event.target.value }))}
                >
                  <option value="">{selectedState ? "Select LGA" : "Select state first"}</option>
                  {lgaOptions.map((lga) => (
                    <option key={lga} value={lga}>{lga}</option>
                  ))}
                </Select>
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
