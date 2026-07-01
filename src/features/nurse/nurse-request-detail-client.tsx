"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPinned, Navigation, Phone, ShieldCheck, Timer } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { homeCareApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { buildWebSocketUrl } from "@/lib/realtime";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { formatDateTime } from "@/lib/utils";
import {
  activeAssignmentForRequest,
  bookingSourceLabel,
  buildVerificationPayload,
  canCompleteCare,
  canMarkArrived,
  canStartCare,
  canStartTrip,
  canVerifyRequest,
  homeCareStatusLabel,
  preferredTimeLabel,
  type VerificationOutcomeOption,
  verificationOutcomeOptions,
} from "@/features/nurse/nurse-utils";

const workflowSteps = [
  { key: "accepted", label: "Verify" },
  { key: "confirmed", label: "Start trip" },
  { key: "in_transit", label: "Arrived" },
  { key: "arrived", label: "Start care" },
  { key: "care_in_progress", label: "Complete care" },
  { key: "care_completed", label: "Patient confirmation" },
] as const;

const workflowOrder: string[] = workflowSteps.map((step) => step.key);

function WorkflowStep({ step, status }: { step: (typeof workflowSteps)[number]; status: string }) {
  const effectiveStatus = status === "verification_in_progress" ? "accepted" : status;
  const currentIndex = workflowOrder.indexOf(effectiveStatus);
  const stepIndex = workflowOrder.indexOf(step.key);
  const completed = currentIndex > stepIndex || status === "patient_confirmed";
  const current = effectiveStatus === step.key;

  return (
    <div
      className={[
        "rounded-[18px] border px-4 py-3",
        current
          ? "border-[rgba(66,107,179,0.2)] bg-[var(--primary-soft)]"
          : completed
            ? "border-emerald-100 bg-emerald-50"
            : "border-slate-200 bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#1F2937]">{step.label}</p>
        <span className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
          {current ? "Now" : completed ? "Done" : "Locked"}
        </span>
      </div>
    </div>
  );
}

export function NurseRequestDetailClient({ requestId }: { requestId: number }) {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [verificationChoice, setVerificationChoice] = useState<VerificationOutcomeOption>("confirmed");
  const [verificationNotes, setVerificationNotes] = useState("");
  const [visitNoteDraft, setVisitNoteDraft] = useState("");
  const [locationMessage, setLocationMessage] = useState("");
  const [liveTrackingConnected, setLiveTrackingConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const requestQuery = useQuery({
    queryKey: ["home-care", "request", requestId],
    queryFn: () => homeCareApi.requestDetail(requestId),
    enabled: userQuery.data?.role === "nurse",
  });
  const eventsQuery = useQuery({
    queryKey: ["home-care", "request", requestId, "events"],
    queryFn: () => homeCareApi.requestEvents(requestId),
    enabled: userQuery.data?.role === "nurse",
  });
  const trackingQuery = useQuery({
    queryKey: ["home-care", "request", requestId, "tracking"],
    queryFn: () => homeCareApi.requestTracking(requestId),
    enabled: userQuery.data?.role === "nurse",
    refetchInterval: liveTrackingConnected ? false : 8000,
  });

  const refreshHomeCare = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["home-care"] });
  }, [queryClient]);

  const verifyMutation = useMutation({
    mutationFn: (assignmentId: number) => homeCareApi.submitVerificationAttempt(assignmentId, buildVerificationPayload(verificationChoice, verificationNotes)),
    onSuccess: async () => {
      setVerificationNotes("");
      await refreshHomeCare();
    },
  });
  const tripMutation = useMutation({
    mutationFn: homeCareApi.startTrip,
    onSuccess: async () => {
      setLocationMessage("Trip started successfully.");
      await refreshHomeCare();
    },
  });
  const arriveMutation = useMutation({
    mutationFn: homeCareApi.markArrived,
    onSuccess: async () => {
      await refreshHomeCare();
    },
  });
  const careStartMutation = useMutation({
    mutationFn: homeCareApi.startCare,
    onSuccess: async () => {
      await refreshHomeCare();
    },
  });
  const careCompleteMutation = useMutation({
    mutationFn: homeCareApi.completeCare,
    onSuccess: async () => {
      await refreshHomeCare();
    },
  });
  const trackingMutation = useMutation({
    mutationFn: ({ assignmentId, latitude, longitude, accuracy }: { assignmentId: number; latitude: number; longitude: number; accuracy?: number }) =>
      homeCareApi.sendTracking(assignmentId, { latitude, longitude, accuracy_meters: accuracy || 0, source: "browser_geolocation" }),
    onSuccess: async () => {
      setLocationMessage("Location update shared.");
      await refreshHomeCare();
    },
  });

  const request = requestQuery.data;
  const assignment = activeAssignmentForRequest(request);
  const alternatePhone = useMemo(() => {
    const snapshot = request?.source_snapshot;
    if (!snapshot || typeof snapshot !== "object") {
      return "";
    }
    const value = snapshot["alternate_phone"];
    return typeof value === "string" ? value : "";
  }, [request?.source_snapshot]);

  useEffect(() => {
    if (userQuery.data?.role !== "nurse") {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

    const wsUrl = buildWebSocketUrl(`/ws/home-care/requests/${requestId}/tracking/`);
    if (!wsUrl) {
      return;
    }

    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;
    socket.onopen = () => setLiveTrackingConnected(true);
    socket.onerror = () => setLiveTrackingConnected(false);
    socket.onclose = () => {
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      setLiveTrackingConnected(false);
    };
    socket.onmessage = async () => {
      await refreshHomeCare();
      setLocationMessage("Live trip update received.");
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [refreshHomeCare, requestId, userQuery.data?.role]);

  async function shareCurrentLocation() {
    if (!assignment) {
      return;
    }
    if (!("geolocation" in navigator)) {
      setLocationMessage("Location sharing is not available on this device.");
      return;
    }

    setLocationMessage("Getting your current location...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        trackingMutation.mutate({
          assignmentId: assignment.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMessage("Location permission was denied. You can still continue without live location.");
          return;
        }
        setLocationMessage("We couldn't read your location right now. Please try again in a moment.");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    );
  }

  if (userQuery.data?.role !== "nurse") {
    return (
      <Section title="Request detail" description="This view is available for nurse accounts only.">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  return (
    <Section
      title={request ? request.contact_name_snapshot || "Request detail" : "Request detail"}
      action={<Link href="/nurse/requests" className="text-sm font-semibold text-[var(--primary)]">Back to requests</Link>}
    >
      {requestQuery.isError ? (
        <Notice title="We couldn't load this request." tone="warning">
          {getFriendlyErrorMessage(requestQuery.error, "homeCare")}
        </Notice>
      ) : null}

      {requestQuery.isLoading ? (
        <InlineLoader label="Preparing nurse request details" />
      ) : request ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-heading text-2xl font-semibold text-[#1F2937]">{request.contact_name_snapshot || "Patient request"}</h2>
                <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[var(--primary)]">
                  {homeCareStatusLabel(request.status)}
                </span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-[#1F2937]">Patient phone</p>
                  <p className="mt-1 text-sm text-slate-600">{request.contact_phone_snapshot || "Not provided"}</p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-[#1F2937]">Alternate phone</p>
                  <p className="mt-1 text-sm text-slate-600">{alternatePhone || "Not provided"}</p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-[#1F2937]">Booking source</p>
                  <p className="mt-1 text-sm text-slate-600">{bookingSourceLabel(request.booking_source)}</p>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-[#1F2937]">Preferred time</p>
                  <p className="mt-1 text-sm text-slate-600">{preferredTimeLabel(request)}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-[#1F2937]">Address and landmark</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{request.service_address_snapshot || "Address not provided yet."}</p>
                {request.service_location_notes ? <p className="mt-2 text-sm text-slate-600">{request.service_location_notes}</p> : null}
              </div>

              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-[#1F2937]">Doctor referral or care notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{request.care_notes || "No extra notes have been shared for this request yet."}</p>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">Current workflow</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-slate-600">
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-[#1F2937]">Assignment</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {assignment ? <StatusBadge value={assignment.status} /> : null}
                    <span>{assignment ? homeCareStatusLabel(assignment.status) : "No active assignment available."}</span>
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-[#1F2937]">Trip status</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <StatusBadge value={request.status} />
                    <span>{homeCareStatusLabel(request.status)}</span>
                  </div>
                </div>
                <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="font-semibold text-[#1F2937]">Last update</p>
                  <p className="mt-1">{formatDateTime(request.updated_at)}</p>
                </div>
              </div>

              <div className="mt-6">
                <p className="font-heading text-lg font-semibold text-[#1F2937]">State-machine progress</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {workflowSteps.map((step) => (
                    <WorkflowStep key={step.key} step={step} status={request.status} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Phone className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">Pre-visit verification</p>
                </div>
              </div>
              <div className="mt-6 grid gap-3">
                <label className="grid gap-2 text-sm font-semibold text-[#1F2937]">
                  Verification outcome
                  <select
                    value={verificationChoice}
                    onChange={(event) => setVerificationChoice(event.target.value as VerificationOutcomeOption)}
                    className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm font-medium text-[#1F2937] outline-none transition focus:border-[var(--primary)]"
                  >
                    {verificationOutcomeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="text-sm text-slate-500">
                  {verificationOutcomeOptions.find((option) => option.value === verificationChoice)?.description}
                </p>
                <label className="grid gap-2 text-sm font-semibold text-[#1F2937]">
                  Notes
                  <textarea
                    value={verificationNotes}
                    onChange={(event) => setVerificationNotes(event.target.value)}
                    rows={4}
                    placeholder="Add any details the care team should know before travel."
                    className="rounded-[14px] border border-slate-200 bg-white px-3 py-3 text-sm text-[#1F2937] outline-none transition focus:border-[var(--primary)]"
                  />
                </label>
                <Button
                  onClick={() => assignment && verifyMutation.mutate(assignment.id)}
                  disabled={!assignment || !canVerifyRequest(assignment, request) || verifyMutation.isPending}
                >
                  {verifyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Navigation className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">Trip and tracking</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  onClick={() => assignment && tripMutation.mutate(assignment.id)}
                  disabled={!assignment || !canStartTrip(assignment, request) || tripMutation.isPending}
                >
                  {tripMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Start trip
                </Button>
                <Button
                  variant="secondary"
                  onClick={shareCurrentLocation}
                  disabled={!assignment || request.status !== "in_transit" || trackingMutation.isPending}
                >
                  {trackingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPinned className="mr-2 h-4 w-4" />}
                  Share current location
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => assignment && arriveMutation.mutate(assignment.id)}
                  disabled={!assignment || !canMarkArrived(assignment, request) || arriveMutation.isPending}
                >
                  {arriveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Arrived
                </Button>
                {locationMessage ? <p className="text-sm text-slate-600">{locationMessage}</p> : null}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.95fr)]">
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Timer className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-heading text-xl font-semibold text-[#1F2937]">Care workflow</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <Button
                  onClick={() => assignment && careStartMutation.mutate(assignment.id)}
                  disabled={!assignment || !canStartCare(assignment, request) || careStartMutation.isPending}
                >
                  {careStartMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Start care
                </Button>
                <label className="grid gap-2 text-sm font-semibold text-[#1F2937]">
                  Visit note draft
                  <textarea
                    value={visitNoteDraft}
                    onChange={(event) => setVisitNoteDraft(event.target.value)}
                    rows={4}
                    placeholder="Capture a short summary for your own workflow."
                    className="rounded-[14px] border border-slate-200 bg-white px-3 py-3 text-sm text-[#1F2937] outline-none transition focus:border-[var(--primary)]"
                  />
                </label>
                <p className="text-sm text-slate-500">
                  This note is a private draft for your visit workflow.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => assignment && careCompleteMutation.mutate(assignment.id)}
                  disabled={!assignment || !canCompleteCare(assignment, request) || careCompleteMutation.isPending}
                >
                  {careCompleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Complete care
                </Button>
                {request.status === "care_completed" ? (
                  <Notice title="Waiting for patient confirmation" tone="neutral" />
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <h2 className="font-heading text-xl font-semibold text-[#1F2937]">Request timeline</h2>
              <p className="mt-1 text-sm text-slate-500">A clear record of what has happened so far.</p>
              {eventsQuery.isLoading ? (
                <InlineLoader className="mt-5" compact label="Loading request timeline" />
              ) : eventsQuery.data?.results.length ? (
                <div className="mt-5 grid gap-3">
                  {eventsQuery.data.results.map((event) => (
                    <div key={event.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#1F2937]">{homeCareStatusLabel(event.to_status || event.event_type)}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(event.created_at)}</p>
                      </div>
                      {event.actor_email ? <p className="mt-1 text-sm text-slate-600">{event.actor_email}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No timeline entries yet" description="Request activity will appear here as the visit moves forward." />
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
            <h2 className="font-heading text-xl font-semibold text-[#1F2937]">Travel tracking</h2>
            <p className="mt-1 text-sm text-slate-500">Recent shared tracking points for this request.</p>
            {trackingQuery.isLoading ? (
              <InlineLoader className="mt-5" compact label="Loading travel updates" />
            ) : trackingQuery.data?.results.length ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {trackingQuery.data.results.map((point) => (
                  <div key={point.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-semibold text-[#1F2937]">
                      {point.latitude}, {point.longitude}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{point.accuracy_meters}m accuracy - {point.source}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(point.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No travel updates yet" description="Shared location points will appear here when tracking starts." />
            )}
          </div>
        </>
      ) : null}
    </Section>
  );
}
