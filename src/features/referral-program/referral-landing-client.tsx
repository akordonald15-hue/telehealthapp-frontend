"use client";

import { useEffect } from "react";
import Link from "next/link";
import { HeartPulse, Home, Stethoscope } from "lucide-react";

import { looksLikeReferralCode, normalizeReferralCode, savePendingReferralCode } from "./referral-code-storage";

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

  useEffect(() => {
    // Persist before the visitor navigates away to sign up. A malformed code is simply not
    // stored; the page still renders rather than erroring.
    if (usable) {
      savePendingReferralCode(normalized);
    }
  }, [normalized, usable]);

  const signupHref = usable ? `/register?ref=${encodeURIComponent(normalized)}` : "/register";

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
          That invite link looks incomplete, but you can still create your account and add a referral code later.
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
