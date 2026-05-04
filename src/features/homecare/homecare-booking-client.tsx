"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { homeCareApi, referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { HomeCareBookingSource, HomeCareRequestCreate, ProviderNurse } from "@/lib/types/backend";

function toIsoOrNull(value: string) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function HomeCareBookingClient() {
  const router = useRouter();
  const userQuery = useCurrentUser();
  const [bookingSource, setBookingSource] = useState<HomeCareBookingSource>("direct");
  const [referralId, setReferralId] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [address, setAddress] = useState("");
  const [locationNotes, setLocationNotes] = useState("");
  const [windowStart, setWindowStart] = useState("");
  const [windowEnd, setWindowEnd] = useState("");
  const [careNotes, setCareNotes] = useState("");
  const [nurseSearch, setNurseSearch] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("");
  const [selectedNurse, setSelectedNurse] = useState<ProviderNurse | null>(null);

  const referralsQuery = useQuery({
    queryKey: ["referrals", "home-care-booking"],
    queryFn: () => referralsApi.list({ page_size: 50 }),
    enabled: userQuery.data?.role === "patient",
  });

  const sentReferrals = useMemo(
    () => (referralsQuery.data?.results ?? []).filter((referral) => referral.status === "sent"),
    [referralsQuery.data?.results],
  );
  const nursesQuery = useQuery({
    queryKey: ["home-care", "available-nurses", nurseSearch, serviceTypeFilter],
    queryFn: () =>
      homeCareApi.availableNurses({
        page_size: 50,
        search: nurseSearch.trim() || undefined,
        service_type: serviceTypeFilter.trim() || undefined,
      }),
    enabled: userQuery.data?.role === "patient",
  });
  const nurseItems = nursesQuery.data?.results ?? [];

  const createRequest = useMutation({
    mutationFn: (body: HomeCareRequestCreate & { callback_url: string }) => homeCareApi.bookRequest(body),
    onSuccess: (response) => {
      if (response.payment.authorization_url) {
        window.location.assign(response.payment.authorization_url);
        return;
      }
      router.replace(`/home-care/requests/${response.request.id}`);
    },
  });

  if (userQuery.data?.role !== "patient") {
    return (
      <Section title="Book home nurse" description="Home nurse booking is available for patient accounts.">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const referralRequired = bookingSource === "doctor_referral";
  const selectedNurseAvailable = !selectedNurse || selectedNurse.availability_status === "available";
  const canSubmit = !createRequest.isPending && selectedNurseAvailable && (!referralRequired || Boolean(referralId));

  return (
    <Section
      title="Book home nurse"
      description="Request a home-care nurse, share the visit location, and track the request from assignment to completion."
      action={
        <Link href="/home-care/requests" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
          My requests <ArrowRight className="h-4 w-4" />
        </Link>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.55fr)]">
        <form
          className="grid gap-5 rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6"
          onSubmit={(event) => {
            event.preventDefault();
            const payload: HomeCareRequestCreate & { callback_url: string } = {
              booking_source: bookingSource,
              referral: bookingSource === "doctor_referral" ? Number(referralId) : null,
              preferred_nurse: selectedNurse?.id ?? null,
              contact_name_snapshot: contactName.trim(),
              contact_phone_snapshot: contactPhone.trim(),
              service_address_snapshot: address.trim(),
              service_location_notes: locationNotes.trim(),
              requested_window_start: toIsoOrNull(windowStart),
              requested_window_end: toIsoOrNull(windowEnd),
              care_notes: careNotes.trim(),
              callback_url: `${window.location.origin}/home-care/requests`,
            };
            createRequest.mutate(payload);
          }}
        >
          {createRequest.error ? (
            <Notice title="We couldn't start this booking." tone="warning">
              {getFriendlyErrorMessage(createRequest.error, "homeCare")}
            </Notice>
          ) : null}
          {createRequest.isSuccess ? (
            <Notice title="Checkout ready" tone="success">
              Redirecting you to Paystack. The nurse request is not marked paid until Paystack verifies payment.
            </Notice>
          ) : null}
          <Notice title="Home nurse booking price: ₦5,000" tone="neutral">
            Caretekk sets the homecare booking price on the backend. Nurse matching starts after Paystack verifies payment.
          </Notice>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Booking source">
              <Select
                value={bookingSource}
                onChange={(event) => setBookingSource(event.target.value as HomeCareBookingSource)}
              >
                <option value="direct">Direct</option>
                <option value="doctor_referral">Doctor referral</option>
              </Select>
            </Field>

            {bookingSource === "doctor_referral" ? (
              <Field label="Sent referral">
                <Select value={referralId} onChange={(event) => setReferralId(event.target.value)}>
                  <option value="">Choose a sent referral</option>
                  {sentReferrals.map((referral) => (
                    <option key={referral.id} value={referral.id}>
                      #{referral.id} - {referral.referred_to}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <p className="font-semibold text-[#1F2937]">Direct booking</p>
                <p className="mt-1">Use this for a new home nurse request that is not tied to a doctor referral.</p>
              </div>
            )}
          </div>

          {bookingSource === "doctor_referral" && referralsQuery.isLoading ? (
            <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Loading sent referrals...
            </div>
          ) : null}

          {bookingSource === "doctor_referral" && !referralsQuery.isLoading && !sentReferrals.length ? (
            <Notice title="Doctor referral booking is ready, but no sent referral is available yet." tone="warning">
              Ask your doctor to send a referral first. Direct booking is available now.
            </Notice>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Search nurses">
              <Input value={nurseSearch} onChange={(event) => setNurseSearch(event.target.value)} placeholder="Name, area, or service" />
            </Field>
            <Field label="Service filter">
              <Input value={serviceTypeFilter} onChange={(event) => setServiceTypeFilter(event.target.value)} placeholder="e.g. wound care" />
            </Field>
          </div>

          <Field label="Preferred nurse" hint="Optional. If you do not choose one, Caretekk will match an available nurse.">
            {nursesQuery.isLoading ? (
              <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">Loading available nurses...</div>
            ) : nursesQuery.isError ? (
              <Notice title="Nurse list could not load." tone="warning">
                You can still submit the request and Caretekk will match a nurse.
              </Notice>
            ) : nurseItems.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {nurseItems.map((nurse) => {
                  const available = nurse.availability_status === "available";
                  const selected = selectedNurse?.id === nurse.id;
                  return (
                    <button
                      key={nurse.id}
                      type="button"
                      disabled={!available}
                      onClick={() => setSelectedNurse(nurse)}
                      className={`rounded-[20px] border p-4 text-left transition ${
                        selected
                          ? "border-[#2563EB] bg-[#EFF6FF] shadow-[0_18px_44px_-34px_rgba(37,99,235,0.5)]"
                          : "border-slate-200 bg-slate-50 hover:border-blue-100 hover:bg-white"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#1F2937]">{nurse.display_name}</p>
                          <p className="mt-1 text-sm text-slate-600">{nurse.service_type || nurse.specialty}</p>
                        </div>
                        <StatusBadge value={nurse.availability_status} />
                      </div>
                      <div className="mt-3 grid gap-1 text-sm text-slate-600">
                        <p>{nurse.location_area || "Location area not provided"}</p>
                        <p>{nurse.service_radius_km ? `${nurse.service_radius_km} km service radius` : "Service radius pending"}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                        {nurse.rating ? <span>Rating {nurse.rating.toFixed(1)}</span> : <span>Rating pending</span>}
                        <span>{nurse.active_workload} active request{nurse.active_workload === 1 ? "" : "s"}</span>
                      </div>
                      <span className={`mt-4 inline-flex min-h-9 items-center rounded-[10px] px-3 text-sm font-extrabold ${available ? "bg-[#2563EB] text-white" : "bg-slate-200 text-slate-500"}`}>
                        {available ? "Request Nurse" : "Unavailable"}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <Notice title="No nurses found" tone="neutral">
                Try clearing the search or service filter. You can still submit the request for automatic matching.
              </Notice>
            )}
            {selectedNurse ? (
              <button type="button" className="mt-3 text-sm font-semibold text-[var(--primary)]" onClick={() => setSelectedNurse(null)}>
                Clear preferred nurse
              </button>
            ) : null}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact name" hint="Leave blank to use your profile details.">
              <Input value={contactName} onChange={(event) => setContactName(event.target.value)} placeholder="Patient or caregiver name" />
            </Field>
            <Field label="Contact phone" hint="Leave blank to use your profile phone.">
              <Input value={contactPhone} onChange={(event) => setContactPhone(event.target.value)} placeholder="+234..." />
            </Field>
          </div>

          <Field label="Service address">
            <Textarea
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              rows={3}
              placeholder="Where should the nurse visit?"
            />
          </Field>

          <Field label="Landmark or access notes">
            <Textarea
              value={locationNotes}
              onChange={(event) => setLocationNotes(event.target.value)}
              rows={3}
              placeholder="Gate code, nearby landmark, floor, or arrival instructions."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred start">
              <Input type="datetime-local" value={windowStart} onChange={(event) => setWindowStart(event.target.value)} />
            </Field>
            <Field label="Preferred end">
              <Input type="datetime-local" value={windowEnd} onChange={(event) => setWindowEnd(event.target.value)} />
            </Field>
          </div>

          <Field label="Care notes">
            <Textarea
              value={careNotes}
              onChange={(event) => setCareNotes(event.target.value)}
              rows={4}
              placeholder="What should the nurse know before the visit?"
            />
          </Field>

          <Button type="submit" disabled={!canSubmit}>
            {createRequest.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {createRequest.isPending ? "Starting checkout..." : "Book and pay ₦5,000"}
          </Button>
        </form>

        <div className="grid content-start gap-4">
          <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
              <ClipboardList className="h-5 w-5" />
            </span>
            <h2 className="font-heading mt-4 text-xl font-semibold text-[#1F2937]">What happens next</h2>
            <div className="mt-5 grid gap-3 text-sm text-slate-600">
              <p>1. Caretekk records the request and starts secure Paystack checkout.</p>
              <p>2. Once payment is verified, matching starts with an available nurse.</p>
              <p>3. You can track status, confirm completion, and rate the visit.</p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
