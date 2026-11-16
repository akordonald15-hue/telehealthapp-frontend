"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { readConsent, saveConsent, subscribeConsent } from "./consent";

export function AdvertisingPreferences({ prompt = false }: { prompt?: boolean }) {
  const consent = useSyncExternalStore(subscribeConsent, readConsent, () => "unknown" as const);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  function choose(value: "granted" | "denied") {
    const saved = saveConsent(value);
    setError(!saved && value === "granted");
    if (saved || value === "denied") { setOpen(false); setDismissed(true); }
  }
  return <>
    <button type="button" className="underline underline-offset-4" onClick={() => setOpen(true)}>Advertising preferences</button>
    {(open || (prompt && consent === "unknown" && !dismissed)) && <section role="dialog" aria-modal="false" aria-label="Advertising preferences" className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-xl rounded-2xl border border-slate-300 bg-white p-5 text-slate-900 shadow-xl">
      <h2 className="text-lg font-semibold">Optional advertising cookies</h2>
      <p className="my-3 text-sm">With your permission, Meta Pixel can measure a visit to our public homepage. Meta receives browser, device and network information and may use advertising cookies. It is not used on healthcare or account pages. Rejecting does not affect your care.</p>
      <Link href="/privacy/advertising" prefetch={false} className="text-sm underline">Read the advertising privacy notice</Link>
      <p className="my-2 text-sm">Current choice: {consent === "unknown" ? "not set" : consent}. You can withdraw permission here at any time.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" className="rounded-lg border border-slate-500 px-4 py-2" onClick={() => choose("denied")}>Reject / withdraw</button>
        <button type="button" className="rounded-lg border border-slate-500 px-4 py-2" onClick={() => choose("granted")}>Allow advertising</button>
        {open && <button type="button" className="px-3 py-2 underline" onClick={() => setOpen(false)}>Close</button>}
      </div>
      {error && <p role="alert" className="mt-3 text-sm">Your permission could not be saved. Advertising remains disabled.</p>}
    </section>}
  </>;
}
