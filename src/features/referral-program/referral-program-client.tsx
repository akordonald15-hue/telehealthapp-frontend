"use client";

import { useState } from "react";
import { Check, Copy, Gift, Share2, Ticket, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorMessage } from "@/components/ui/error-message";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { extractErrorMessage, ApiError } from "@/lib/api/client";
import type { MyReferral, MyReferralReward, ReferralProgrammeTerms } from "@/lib/types/backend";


import { formatReferralDate } from "./format";
import {
  isProgrammeUnavailable,
  useAttachReferralCode,
  useMyReferrals,
  useMyRewards,
  useReferralCode,
} from "./use-referral-program";
import { normalizeReferralCode } from "./referral-code-storage";

/**
 * Programme terms are rendered from the backend response, never hard-coded: the server owns
 * the percentage, the cap and every window, and they are configurable in production.
 */
function rewardHeadline(terms: Pick<ReferralProgrammeTerms, "reward_type" | "reward_value">) {
  if (terms.reward_type === "percent") {
    return `${trimAmount(terms.reward_value)}% off`;
  }
  return `${formatNaira(terms.reward_value)} off`;
}

function trimAmount(value: string) {
  // "25.00" reads better as "25" in a headline; the exact value stays in the detail line.
  return value.replace(/\.00$/, "");
}

function formatNaira(value: string | null) {
  if (!value) {
    return "";
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return `₦${value}`;
  }
  return `₦${amount.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

/** Patient-facing wording for the backend's referral status. Never colour alone. */
const referralStatusCopy: Record<string, { label: string; tone: "neutral" | "success" | "warning" }> = {
  pending: { label: "Pending", tone: "neutral" },
  qualifying: { label: "Qualifying", tone: "warning" },
  under_review: { label: "Under review", tone: "warning" },
  successful: { label: "Successful", tone: "success" },
  not_qualified: { label: "Not qualified", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
};

const rewardStatusCopy: Record<string, string> = {
  issued: "Available",
  reserved: "Reserved for a pending booking",
  used: "Used",
  expired: "Expired",
  revoked: "No longer available",
};

function StatusPill({ label, tone }: { label: string; tone: "neutral" | "success" | "warning" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  } as const;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}

function CopyButton({ value, label, copiedLabel }: { value: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      // Follows the existing Caretekk copy pattern: inline confirmation, no toast system exists.
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          setCopied(false);
        }
      }}
      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[8px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:flex-none"
      aria-live="polite"
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      {copied ? copiedLabel : label}
    </button>
  );
}

function ShareButtons({ shareUrl, shareText }: { shareUrl: string; shareText: string }) {
  const [shareError, setShareError] = useState("");
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  // A plain wa.me link: no WhatsApp API integration in this phase.
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <CopyButton value={shareUrl} label="Copy link" copiedLabel="Link copied" />
        {canNativeShare ? (
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.share({ title: "Caretekk", text: shareText, url: shareUrl });
                setShareError("");
              } catch {
                // A cancelled share is not a failure worth reporting.
                setShareError("");
              }
            }}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 sm:flex-none"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            Share
          </button>
        ) : null}
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[8px] border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 sm:flex-none"
        >
          Share on WhatsApp
        </a>
      </div>
      {shareError ? <p className="text-xs text-slate-500">{shareError}</p> : null}
    </div>
  );
}

function ReferralCodeCard() {
  const codeQuery = useReferralCode();

  if (codeQuery.isPending) {
    return <InlineLoader label="Loading your referral code" />;
  }

  if (isProgrammeUnavailable(codeQuery.error)) {
    return (
      <Notice title="Referral programme is temporarily unavailable" tone="warning">
        Invites are paused right now. Everything else in Caretekk works as normal — please check back later.
      </Notice>
    );
  }

  if (codeQuery.isError || !codeQuery.data) {
    return <ErrorMessage error={codeQuery.error} />;
  }

  const { code, share_url: shareUrl, share_text: shareText, programme } = codeQuery.data;

  return (
    <div className="grid gap-4">
      {programme ? (
        <div className="ct-surface rounded-[8px] p-5">
          <h3 className="text-base font-semibold text-slate-900">
            Get {rewardHeadline(programme)} when a friend completes their first paid service
          </h3>
          <ul className="mt-3 grid gap-1.5 text-sm text-slate-600">
            {programme.max_reward_amount ? (
              <li>Maximum discount {formatNaira(programme.max_reward_amount)}.</li>
            ) : null}
            <li>
              Your friend must be new to Caretekk and spend at least{" "}
              {formatNaira(programme.min_qualifying_paid_amount)} on their first service.
            </li>
            <li>
              Your reward arrives {programme.qualification_hold_days} days after their service is completed, and
              lasts {programme.reward_expiry_days} days.
            </li>
          </ul>
        </div>
      ) : null}

      <div className="ct-surface rounded-[8px] p-5">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Your referral code</h3>
        <p
          className="mt-2 select-all break-all font-mono text-2xl font-bold tracking-[0.18em] text-slate-900"
          // Selectable so a patient can long-press to copy on mobile.
          data-testid="referral-code"
        >
          {code}
        </p>
        <p className="mt-1 break-all text-xs text-slate-500">{shareUrl}</p>
        <div className="mt-4 grid gap-2">
          <ShareButtons shareUrl={shareUrl} shareText={shareText} />
          <CopyButton value={code} label="Copy code" copiedLabel="Code copied" />
        </div>
      </div>
    </div>
  );
}

function ReferralRow({ referral }: { referral: MyReferral }) {
  const copy = referralStatusCopy[referral.status] ?? referralStatusCopy.pending;
  return (
    <li className="ct-surface flex flex-col gap-2 rounded-[8px] p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {/* Deliberately anonymous: the backend never reveals who was referred. */}
        <p className="text-sm font-semibold text-slate-900">Invite sent {formatReferralDate(referral.attached_at)}</p>
        <p className="text-xs text-slate-500">
          {referral.status === "successful"
            ? "Reward earned"
            : referral.status === "qualifying"
              ? "Their service is completing"
              : referral.status === "under_review"
                ? "We are checking this invite"
                : referral.status === "not_qualified"
                  ? "This invite did not qualify"
                  : "Waiting for their first paid service"}
        </p>
      </div>
      <StatusPill label={copy.label} tone={copy.tone} />
    </li>
  );
}

function MyReferralsSection({ onShare }: { onShare: () => void }) {
  const [page, setPage] = useState(1);
  const referrals = useMyReferrals(page);

  if (referrals.isPending) {
    return <InlineLoader label="Loading your invites" />;
  }
  if (referrals.isError) {
    return <ErrorMessage error={referrals.error} />;
  }

  const results = referrals.data?.results ?? [];
  const total = referrals.data?.count ?? 0;
  const successful = results.filter((item) => item.status === "successful").length;
  const pending = results.filter((item) => ["pending", "qualifying", "under_review"].includes(item.status)).length;

  if (!total) {
    return (
      <EmptyState
        title="You haven't referred anyone yet"
        description="Share your referral link with someone who hasn't used Caretekk before."
        icon={Users}
        action={
          <Button type="button" onClick={onShare}>
            Share referral link
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-3">
      <dl className="grid grid-cols-3 gap-2">
        {[
          { label: "Invited", value: total },
          { label: "Successful", value: successful },
          { label: "Pending", value: pending },
        ].map((stat) => (
          <div key={stat.label} className="ct-surface rounded-[8px] p-3 text-center">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{stat.label}</dt>
            <dd className="mt-1 text-xl font-bold text-slate-900">{stat.value}</dd>
          </div>
        ))}
      </dl>
      <ul className="grid gap-2">
        {results.map((referral) => (
          <ReferralRow key={referral.public_id} referral={referral} />
        ))}
      </ul>
      {referrals.data?.next || page > 1 ? (
        <div className="flex items-center justify-between gap-2">
          <Button type="button" variant="secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={!referrals.data?.next}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function RewardCard({ reward }: { reward: MyReferralReward }) {
  const headline = rewardHeadline(reward);
  const statusLabel = rewardStatusCopy[reward.status] ?? reward.status;
  return (
    <li className="ct-surface grid gap-2 rounded-[8px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-bold text-slate-900">{headline}</p>
          {reward.max_reward_amount ? (
            <p className="text-xs text-slate-500">Up to {formatNaira(reward.max_reward_amount)}</p>
          ) : null}
        </div>
        <StatusPill
          label={statusLabel}
          tone={reward.is_redeemable ? "success" : reward.status === "reserved" ? "warning" : "neutral"}
        />
      </div>
      <p className="text-xs text-slate-500">
        {reward.status === "used" && reward.used_at
          ? `Used ${formatReferralDate(reward.used_at)}`
          : reward.status === "expired"
            ? `Expired ${formatReferralDate(reward.expires_at)}`
            : `Expires ${formatReferralDate(reward.expires_at)}`}
      </p>
      {reward.status === "reserved" ? (
        <p className="rounded-[6px] bg-amber-50 p-3 text-xs text-amber-800">
          This reward is reserved for a pending booking. Cancel that booking if you want to release the reward.
        </p>
      ) : null}
    </li>
  );
}

function MyRewardsSection() {
  const rewards = useMyRewards();

  if (rewards.isPending) {
    return <InlineLoader label="Loading your rewards" />;
  }
  if (rewards.isError) {
    return <ErrorMessage error={rewards.error} />;
  }

  const results = rewards.data?.results ?? [];
  if (!results.length) {
    return (
      <EmptyState
        title="No rewards yet"
        description="When a friend you invited completes their first paid service, your reward appears here."
        icon={Gift}
      />
    );
  }

  return (
    <ul className="grid gap-2">
      {results.map((reward) => (
        <RewardCard key={reward.public_id} reward={reward} />
      ))}
    </ul>
  );
}

/**
 * Lets an existing patient apply a code they were given. The backend decides eligibility and
 * returns one generic refusal for every reason, so this never guesses why.
 */
function ApplyCodePanel() {
  const attach = useAttachReferralCode();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);

  if (applied) {
    return (
      <Notice title="Referral code applied" tone="success">
        Thanks — your invite is linked to your account.
      </Notice>
    );
  }

  const refusal =
    attach.error instanceof ApiError ? extractErrorMessage(attach.error.payload) : "";

  return (
    <form
      className="ct-surface grid gap-3 rounded-[8px] p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = normalizeReferralCode(code);
        if (!normalized) {
          return;
        }
        attach.mutate({ code: normalized }, { onSuccess: () => setApplied(true) });
      }}
    >
      <h3 className="text-sm font-semibold text-slate-900">Have a referral code?</h3>
      <Field label="Referral code">
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="e.g. DONALD7K3Q"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
        />
      </Field>
      {refusal ? <p className="text-sm text-slate-600">{refusal}</p> : null}
      <Button type="submit" disabled={attach.isPending || !normalizeReferralCode(code)}>
        {attach.isPending ? "Applying..." : "Apply code"}
      </Button>
    </form>
  );
}

export function ReferralProgramClient() {
  const codeQuery = useReferralCode();
  const referrals = useMyReferrals(1);
  const programmeUnavailable = isProgrammeUnavailable(codeQuery.error);

  // Only offer "apply a code" to someone who has not been referred already. The backend is
  // authoritative; this just avoids showing an action that can only be refused.
  const alreadyReferred = (referrals.data?.count ?? 0) > 0;

  const shareUrl = codeQuery.data?.share_url ?? "";

  return (
    <Section
      title="Refer & Earn"
      description="Invite friends to Caretekk and earn a discount on your next booking."
    >
      <div className="grid gap-6">
        <ReferralCodeCard />

        {!programmeUnavailable ? (
          <>
            <div className="grid gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                <Users className="h-4 w-4" aria-hidden />
                Your referrals
              </h2>
              <MyReferralsSection
                onShare={async () => {
                  if (!shareUrl) return;
                  try {
                    await navigator.clipboard.writeText(shareUrl);
                  } catch {
                    /* copy is best effort */
                  }
                }}
              />
            </div>

            <div className="grid gap-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
                <Ticket className="h-4 w-4" aria-hidden />
                Your rewards
              </h2>
              <MyRewardsSection />
            </div>

            {!alreadyReferred ? <ApplyCodePanel /> : null}
          </>
        ) : null}
      </div>
    </Section>
  );
}
