"use client";

import { formatAppointmentTime } from "@/lib/appointment-time";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Notice } from "@/components/ui/notice";
import type { Founder50Controller } from "./use-founder50";

export function PromotionCheckout({
  promotion: p,
  rewardSelected = false,
  pendingDoctorName,
}: {
  promotion: Founder50Controller;
  rewardSelected?: boolean;
  pendingDoctorName?: string;
}) {
  const id = useId();
  const [code, setCode] = useState("");
  const [now, setNow] = useState(0);
  const reconciled = useRef("");
  const claim = p.reservation?.reservation;
  const expiry = claim?.status === "reserved" ? claim.expires_at : "";
  useEffect(() => {
    if (!p.enabled || !expiry) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [p.enabled, expiry]);
  useEffect(() => {
    if (expiry && now >= Date.parse(expiry) && reconciled.current !== expiry) {
      reconciled.current = expiry;
      void p.refresh();
    }
  }, [expiry, now, p]);
  if (!p.enabled) return null;
  const minutes = expiry
    ? Math.max(0, Math.ceil((Date.parse(expiry) - now) / 60000))
    : 0;
  const price = p.reservation?.pricing;
  const money = (value: string, currency: string) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  const committed =
    claim && ["booked", "redeemed", "forfeited"].includes(claim.status);
  return (
    <section
      aria-label="Promotional consultation"
      aria-busy={p.busy}
      className="min-w-0 space-y-3 rounded-[8px] border border-primary/20 bg-primary-soft/40 p-4"
    >
      <p className="font-semibold text-ash-900">Have a promo code?</p>
      {!p.ready ? (
        <p role="status" className="text-sm">
          {p.error ? "Promotion status is unavailable. You can retry the status check." : "Checking your promotion status…"}
        </p>
      ) : null}
      {committed ? (
        <Notice
          title={
            claim.status === "redeemed"
              ? "Your Founder50 consultation has been used."
              : "Your Founder50 consultation is already booked."
          }
        >
          Your appointment is not subject to the reservation countdown.{" "}
          <Link className="underline" href="/appointments">
            View your appointments
          </Link>
          .
          {!p.pending ? (
            <Button
              type="button"
              variant="secondary"
              disabled={p.busy}
              onClick={p.choosePaid}
            >
              Choose ordinary paid checkout for another consultation
            </Button>
          ) : null}
        </Notice>
      ) : null}
      {p.free && price ? (
        <>
          <div role="status" className="text-sm font-semibold text-emerald-800">
            Founder50 applied. Your consultation is free.
          </div>
          <dl className="space-y-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt>Consultation</dt>
              <dd>{money(price.service_value, price.currency)}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt>Founder50 discount</dt>
              <dd>−{money(price.discount, price.currency)}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-t pt-2 font-semibold">
              <dt>Total to pay</dt>
              <dd>{money(price.amount_due, price.currency)}</dd>
            </div>
          </dl>
          <p className="text-sm text-ash-700">
            Reserve until {new Date(claim!.expires_at).toLocaleString()}.{" "}
            {now
              ? minutes > 0
                ? `${Math.floor(minutes / 60)}h ${minutes % 60}m remaining to confirm your booking.`
                : "Checking reservation expiry with the server."
              : ""}{" "}
            This deadline ends when you book.
          </p>
          <Button
            type="button"
            variant="ghost"
            disabled={p.busy || Boolean(p.pending)}
            onClick={() => void p.release()}
          >
            Remove promotion
          </Button>
        </>
      ) : !committed ? (
        <>
          {claim?.status === "expired" ? (
            <p role="status" className="text-sm">
              Your reservation expired. Apply again to check availability.
            </p>
          ) : null}
          {(claim?.status === "expired" || p.failedApply) && !p.pending ? (
            <Button
              type="button"
              variant="secondary"
              disabled={p.busy}
              onClick={p.choosePaid}
            >
              Choose ordinary paid checkout
            </Button>
          ) : null}
          {p.availability?.code === "capacity_exhausted" ? (
            <p role="status" className="text-sm">
              All 50 Founder50 consultations are currently claimed.
            </p>
          ) : null}
          {p.availability?.code === "campaign_unavailable" ? (
            <p className="text-sm">Founder50 is currently unavailable.</p>
          ) : null}
          <label htmlFor={id} className="block text-sm font-medium">
            Promo code
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={id}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={32}
              placeholder="Enter promo code"
              disabled={p.busy || !p.ready || Boolean(p.pending) || rewardSelected}
              aria-describedby={`${id}-help${p.error ? ` ${id}-error` : ""}`}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!p.busy) void p.apply(code);
                }
              }}
            />
            <Button
              type="button"
              disabled={
                p.busy || !p.ready || Boolean(p.pending) || rewardSelected
              }
              onClick={() => void p.apply(code)}
            >
              {p.busy ? "Please wait…" : "Apply"}
            </Button>
          </div>
          <p id={`${id}-help`} className="text-xs text-ash-600">
            {rewardSelected
              ? "Remove the selected referral reward to apply a promotion."
              : "Apply checks eligibility and reserves an available entitlement. It does not reserve a doctor slot."}
          </p>
        </>
      ) : null}
      {p.error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-800">
          {p.error}
        </p>
      ) : null}
      {p.pending ? (
        <Notice title="A booking request needs recovery.">
          Doctor and time changes are locked until this request is resolved.
          Original doctor: {pendingDoctorName || `Doctor #${p.pending.doctor}`}. Original appointment:{" "}
          {formatAppointmentTime(p.pending.scheduled_at)}. Recover this
          original request before changing your selection or paying.{" "}
          <Button type="button" disabled={p.busy} onClick={() => void p.book()}>
            Recover booking result
          </Button>
        </Notice>
      ) : null}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={p.busy}
        onClick={() => void p.refresh()}
      >
        Refresh promotion status
      </Button>
    </section>
  );
}

export function PromotionConfirmation({
  promotion: p,
}: {
  promotion: Founder50Controller;
}) {
  if (!p.enabled || !p.result) return null;
  const a = p.result.appointment;
  return (
    <Notice title="Your free consultation is confirmed." tone="success">
      <p>Founder50 applied · Amount paid: ₦0.</p>
      <p>
        {a.doctor_profile?.display_name || "Your selected doctor"} ·{" "}
        {formatAppointmentTime(a.scheduled_at)}
      </p>
      <p>
        Your appointment remains funded even when scheduled beyond 24 hours.
      </p>
      <Link href={`/appointments/${a.id}`} className="font-semibold underline">
        Open appointment details
      </Link>
    </Notice>
  );
}
