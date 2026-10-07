"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { Gift, HeartPulse, Home, Stethoscope } from "lucide-react";

import { hasStoredSession } from "@/lib/auth/tokens";

import { looksLikeReferralCode, normalizeReferralCode, savePendingReferralCode } from "./referral-code-storage";

// The session cookie does not change while this page is open, so there is nothing to subscribe
// to; this exists only to read it safely across the server/client boundary.
function subscribeToSession() {
  return () => undefined;
}

function getServerSession() {
  return false;
}

/**
 * Public landing page for a shared referral link (`/r/<code>`).
 *
 * Two jobs: explain Caretekk to someone who has never used it, and carry the code into the
 * signup journey. It deliberately promises the *visitor* nothing: in v1 the reward belongs to
 * the referrer, and advertising a discount the backend will not grant would be a lie.
 *
 * It never names the referrer. The backend does not expose that, and it should not.
 */
export function ReferralLandingClient({ code }: { code: string }) {
  const normalized = normalizeReferralCode(code);
  const usable = looksLikeReferralCode(normalized);
  // Cookies are unreadable during SSR, so the server snapshot is "signed out" -- the common
  // case for an invite link -- and the client corrects it on hydration without a mismatch.
  const signedIn = useSyncExternalStore(subscribeToSession, hasStoredSession, getServerSession);

  useEffect(() => {
    // Persist before the visitor navigates away to sign up. A malformed code is simply not
    // stored; the page still renders rather than erroring.
    //
    // A code is never stored for someone already signed in: referral codes apply at signup
    // only, so keeping it would just leak into an unrelated later registration on this browser.
    if (usable && !signedIn) {
      savePendingReferralCode(normalized);
    }
  }, [normalized, signedIn, usable]);

  const signupHref = usable ? `/register?ref=${encodeURIComponent(normalized)}` : "/register";

  if (signedIn) {
    return (
      <main className="mx-auto grid min-h-dvh w-full max-w-md content-start gap-6 px-4 py-10 sm:py-16">
        <header className="grid gap-3">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
            <HeartPulse className="h-3.5 w-3.5" aria-hidden />
            Caretekk invite
          </span>
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
            You&apos;re already signed in
          </h1>
          <p className="text-[15px] leading-relaxed text-slate-600">
            Referral codes can only be applied when creating a new Caretekk account, so this
            invite won&apos;t change anything on your account.
          </p>
          <p className="text-[15px] leading-relaxed text-slate-600">
            You can still invite your own friends and earn rewards.
          </p>
        </header>

        <div className="grid gap-2">
          <Link
            href="/dashboard"
            className="inline-flex min-h-13 items-center justify-center rounded-[8px] bg-[var(--primary)] px-6 text-base font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_20px_-10px_rgba(37,99,235,0.45)] transition hover:bg-[var(--primary-strong)]"
          >
            Go to Caretekk
          </Link>
          <Link
            href="/refer"
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-[8px] border border-[var(--primary-soft)] px-6 text-base font-semibold text-[var(--primary)] transition hover:bg-[var(--primary-soft)]"
          >
            <Gift className="h-4 w-4" aria-hidden />
            Refer &amp; Earn
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto grid min-h-dvh w-full max-w-md content-start gap-6 px-4 py-10 sm:py-16">
      <header className="grid gap-3">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-semibold text-[var(--primary)]">
          <HeartPulse className="h-3.5 w-3.5" aria-hidden />
          Caretekk invite
        </span>
        <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">
          You&apos;ve been invited to Caretekk
        </h1>
        <p className="text-[15px] leading-relaxed text-slate-600">
          Speak with doctors and access home-care services from Caretekk.
        </p>
      </header>

      <ul className="grid gap-3">
        {[
          { icon: Stethoscope, title: "Talk to a doctor", body: "Book a consultation without leaving home." },
          { icon: Home, title: "Home care visits", body: "A qualified nurse comes to you." },
        ].map((item) => (
          <li key={item.title} className="ct-surface flex items-start gap-3 rounded-[8px] p-4">
            <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" aria-hidden />
            <div>
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <p className="text-sm text-slate-600">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>

      {usable ? (
        <p className="text-sm text-slate-600">
          Your invite code{" "}
          <span className="select-all font-mono font-semibold tracking-[0.12em] text-slate-900">{normalized}</span>{" "}
          will be applied when you create your account.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          That invite link looks incomplete. You can still create your account, and enter the
          referral code yourself on the signup form.
        </p>
      )}

      <div className="grid gap-2">
        <Link
          href={signupHref}
          className="inline-flex min-h-13 items-center justify-center rounded-[8px] bg-[var(--primary)] px-6 text-base font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_20px_-10px_rgba(37,99,235,0.45)] transition hover:bg-[var(--primary-strong)]"
        >
          Get Started
        </Link>
        <Link
          href="/login"
          className="inline-flex min-h-11 items-center justify-center rounded-[8px] text-sm font-semibold text-slate-600 transition hover:text-[var(--primary)]"
        >
          I already have an account
        </Link>
      </div>
    </main>
  );
}
