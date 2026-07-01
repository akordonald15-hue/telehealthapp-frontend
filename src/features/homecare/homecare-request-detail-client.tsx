"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPinned, Star } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { Textarea } from "@/components/ui/input";
import { homeCareApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { buildWebSocketUrl } from "@/lib/realtime";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import { formatDateTime, formatMoney } from "@/lib/utils";
import {
  bookingSourceLabel,
  canCancelHomeCare,
  canConfirmHomeCare,
  canRateHomeCare,
  eventSummary,
  homeCareStatusLabel,
  homeCareTimeline,
  preferredTimeLabel,
  referralNotes,
  statusStepState,
} from "@/features/homecare/homecare-utils";

export function HomeCareRequestDetailClient({ requestId }: { requestId: number }) {
  const queryClient = useQueryClient();
  const userQuery = useCurrentUser();
  const [cancelReason, setCancelReason] = useState("");
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [liveTrackingConnected, setLiveTrackingConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  const requestQuery = useQuery({
    queryKey: ["home-care", "request", requestId],
    queryFn: () => homeCareApi.requestDetail(requestId),
    enabled: userQuery.data?.role === "patient",
  });
  const eventsQuery = useQuery({
    queryKey: ["home-care", "request", requestId, "events"],
    queryFn: () => homeCareApi.requestEvents(requestId),
    enabled: userQuery.data?.role === "patient",
  });
  const trackingQuery = useQuery({
    queryKey: ["home-care", "request", requestId, "tracking"],
    queryFn: () => homeCareApi.requestTracking(requestId),
    enabled: userQuery.data?.role === "patient",
    refetchInterval: liveTrackingConnected ? false : 8000,
  });

  const refreshHomeCare = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["home-care"] });
  }, [queryClient]);

  const cancelMutation = useMutation({
    mutationFn: () => homeCareApi.cancelRequest(requestId, { reason: cancelReason.trim() || "Cancelled by patient." }),
    onSuccess: async () => {
      setCancelReason("");
      await refreshHomeCare();
    },
  });
  const confirmMutation = useMutation({
    mutationFn: () => homeCareApi.confirmCompletion(requestId),
    onSuccess: refreshHomeCare,
  });
  const ratingMutation = useMutation({
    mutationFn: () =>
      homeCareApi.submitRating(requestId, {
        score: Number(ratingScore),
        feedback: ratingFeedback.trim(),
      }),
    onSuccess: async () => {
      setRatingFeedback("");
      await refreshHomeCare();
    },
  });

  useEffect(() => {
    if (userQuery.data?.role !== "patient") {
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
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [refreshHomeCare, requestId, userQuery.data?.role]);

  if (userQuery.data?.role !== "patient") {
    return (
      <Section title="Home Care">
        <Notice title="This view is not available for your account." tone="warning" />
      </Section>
    );
  }

  const request = requestQuery.data;
  const nurse = request?.current_assignment?.nurse;
  const notesFromReferral = referralNotes(request);

  return (
    <Section
      title={request ? request.contact_name_snapshot || "Home Care" : "Home Care"}
      action={<Link href="/home-care/requests" className="text-sm font-semibold text-[var(--primary)]">Back to requests</Link>}
    >
      {requestQuery.isError ? (
        <Notice title="We couldn't load this homecare request." tone="warning">
          {getFriendlyErrorMessage(requestQuery.error, "homeCare")}
        </Notice>
      ) : null}

      {requestQuery.isLoading ? (
        <InlineLoader label="Preparing your home care request" />
      ) : request ? (
        <>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.86fr)]">
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-heading text-2xl font-semibold text-[#1F2937]">{homeCareStatusLabel(request.status)}</h2>
                <Badge tone="blue">{bookingSourceLabel(request.booking_source)}</Badge>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <Info label="Assigned nurse" value={nurse ? nurse.display_name : "Waiting for assignment"} />
                <Info label="Nurse status" value={nurse?.availability_status || "Not assigned yet"} />
                <Info label="Service" value={request.service_name_snapshot || "Home care"} />
                <Info label="Price" value={request.service_price_snapshot ? formatMoney(request.service_price_snapshot) : "Pending"} />
                <Info label="Preferred time" value={preferredTimeLabel(request)} />
                <Info label="Last update" value={formatDateTime(request.updated_at)} />
              </div>

              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-[#1F2937]">Visit address</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{request.service_address_snapshot || "Address not provided yet."}</p>
                {request.service_location_notes ? <p className="mt-2 text-sm leading-6 text-slate-600">{request.service_location_notes}</p> : null}
              </div>

              <div className="mt-4 rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-[#1F2937]">Notes</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{request.care_notes || "No care notes were added."}</p>
                {notesFromReferral ? (
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    <span className="font-semibold text-[#1F2937]">Doctor notes: </span>
                    {notesFromReferral}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <h2 className="font-heading text-xl font-semibold text-[#1F2937]">Status timeline</h2>
              <div className="mt-5 grid gap-3">
                {homeCareTimeline.map((step) => {
                  const state = statusStepState(step.status, request.status);
                  return (
                    <div key={step.status} className="flex items-center gap-3">
                      <span
                        className={
                          state === "done"
                            ? "h-3 w-3 rounded-full bg-emerald-600"
                            : state === "current"
                              ? "h-3 w-3 rounded-full bg-[var(--primary)] shadow-[0_0_0_6px_rgba(66,107,179,0.14)]"
                              : "h-3 w-3 rounded-full bg-slate-200"
                        }
                      />
                      <span className={state === "pending" ? "text-sm text-slate-400" : "text-sm font-semibold text-[#1F2937]"}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <ActionPanel
              title="Cancel request"
              description={
                canCancelHomeCare(request.status)
                  ? "Cancel this request if your plans change."
                  : "Cancellation is not available right now."
              }
            >
              {cancelMutation.error ? (
                <Notice title="Cancellation failed" tone="warning">
                  {getFriendlyErrorMessage(cancelMutation.error, "homeCare")}
                </Notice>
              ) : null}
              <Textarea
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={3}
                placeholder="Reason for cancellation"
                disabled={!canCancelHomeCare(request.status)}
              />
              <Button
                variant="secondary"
                disabled={!canCancelHomeCare(request.status) || cancelMutation.isPending}
                onClick={() => cancelMutation.mutate()}
              >
                {cancelMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Cancel request
              </Button>
            </ActionPanel>

            <ActionPanel
              title="Confirm completion"
              description={
                canConfirmHomeCare(request.status)
                  ? "Confirm when care is complete."
                  : "This will be available after care is complete."
              }
            >
              {confirmMutation.error ? (
                <Notice title="Confirmation failed" tone="warning">
                  {getFriendlyErrorMessage(confirmMutation.error, "homeCare")}
                </Notice>
              ) : null}
              <Button disabled={!canConfirmHomeCare(request.status) || confirmMutation.isPending} onClick={() => confirmMutation.mutate()}>
                {confirmMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm completion
              </Button>
            </ActionPanel>

            <ActionPanel
              title="Rate nurse"
              description={
                canRateHomeCare(request.status)
                  ? "Share your feedback."
                  : "Rating will be available after completion is confirmed."
              }
            >
              {ratingMutation.error ? (
                <Notice title="Rating failed" tone="warning">
                  {getFriendlyErrorMessage(ratingMutation.error, "homeCare")}
                </Notice>
              ) : null}
              {ratingMutation.isSuccess ? <Notice title="Rating submitted" tone="success" /> : null}
              <StarRatingInput value={ratingScore} disabled={!canRateHomeCare(request.status)} onChange={setRatingScore} />
              <Textarea
                value={ratingFeedback}
                onChange={(event) => setRatingFeedback(event.target.value)}
                rows={3}
                placeholder="Optional feedback"
                disabled={!canRateHomeCare(request.status)}
              />
              <Button
                variant="secondary"
                disabled={!canRateHomeCare(request.status) || ratingMutation.isPending}
                onClick={() => ratingMutation.mutate()}
              >
                {ratingMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Star className="mr-2 h-4 w-4" />}
                Submit rating
              </Button>
            </ActionPanel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.86fr)]">
            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <h2 className="font-heading text-xl font-semibold text-[#1F2937]">Request activity</h2>
              {eventsQuery.isLoading ? (
                <InlineLoader className="mt-5" compact label="Loading request activity" />
              ) : eventsQuery.data?.results.length ? (
                <div className="mt-5 grid gap-3">
                  {eventsQuery.data.results.map((event) => (
                    <div key={event.id} className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm font-semibold text-[#1F2937]">{eventSummary(event)}</p>
                        <p className="text-xs text-slate-500">{formatDateTime(event.created_at)}</p>
                      </div>
                      {event.actor_email ? <p className="mt-1 text-sm text-slate-600">{event.actor_email}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No activity yet." description="" />
              )}
            </div>

            <div className="rounded-[28px] border border-white/70 bg-white p-6 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)]">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <MapPinned className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-heading text-xl font-semibold text-[#1F2937]">Travel updates</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Location updates appear here.</p>
                </div>
              </div>
              {trackingQuery.isLoading ? (
                <InlineLoader className="mt-5" compact label="Loading travel updates" />
              ) : trackingQuery.data?.results.length ? (
                <div className="mt-5 grid gap-3">
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
                <EmptyState title="No travel updates yet." description="" />
              )}
            </div>
          </div>
        </>
      ) : null}
    </Section>
  );
}

function StarRatingInput({
  value,
  disabled,
  onChange,
}: {
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-[#1F2937]">Rating</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Rate nurse">
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            role="radio"
            aria-checked={value === score}
            disabled={disabled}
            onClick={() => onChange(score)}
            className={[
              "inline-flex h-11 w-11 items-center justify-center rounded-[10px] border text-lg transition",
              score <= value ? "border-amber-200 bg-amber-50 text-amber-500" : "border-slate-200 bg-white text-slate-300",
              disabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5",
            ].join(" ")}
          >
            <Star className={score <= value ? "h-5 w-5 fill-current" : "h-5 w-5"} />
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{value} out of 5</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-sm font-semibold text-[#1F2937]">{label}</p>
      <p className="mt-1 text-sm text-slate-600">{value}</p>
    </div>
  );
}

function ActionPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-4 rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-[#1F2937]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </div>
  );
}
