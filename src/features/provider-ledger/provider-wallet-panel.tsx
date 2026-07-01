"use client";

import { useQuery } from "@tanstack/react-query";
import { Banknote, Clock3, CreditCard, History, WalletCards } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineLoader } from "@/components/ui/loaders";
import { Notice } from "@/components/ui/notice";
import { ApiError } from "@/lib/api/client";
import { providerLedgerApi } from "@/lib/api/endpoints";
import { formatDateTime, formatMoney } from "@/lib/utils";

function ledgerLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function transactionAmount(transaction: { entries: { amount: string; currency: string; direction: "debit" | "credit" }[] }) {
  const visibleEntry = transaction.entries.find((entry) => entry.direction === "credit") ?? transaction.entries[0];
  if (!visibleEntry) {
    return null;
  }
  return formatMoney(visibleEntry.amount, visibleEntry.currency);
}

function isFeatureUnavailable(error: unknown) {
  return error instanceof ApiError && error.status === 403 && error.message.toLowerCase().includes("not enabled");
}

function MoneyCard({
  label,
  value,
  currency,
  description,
}: {
  label: string;
  value: string;
  currency: string;
  description: string;
}) {
  return (
    <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-2 font-heading text-2xl font-semibold text-[#1F2937]">{formatMoney(value, currency)}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export function ProviderWalletPanel({ role }: { role: "doctor" | "nurse" }) {
  const walletQuery = useQuery({
    queryKey: ["provider-ledger", "wallet", role],
    queryFn: providerLedgerApi.wallet,
  });
  const transactionsQuery = useQuery({
    queryKey: ["provider-ledger", "transactions", role],
    queryFn: () => providerLedgerApi.transactions({ page_size: 8 }),
    enabled: walletQuery.isSuccess,
  });

  if (walletQuery.isLoading) {
    return (
      <div className="rounded-[8px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6">
        <InlineLoader compact label="Preparing your wallet summary" />
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-32 rounded-[8px] bg-slate-50" />
          ))}
        </div>
      </div>
    );
  }

  if (walletQuery.isError) {
    if (isFeatureUnavailable(walletQuery.error)) {
      return (
        <Notice title="Provider wallet is not available yet">
          Caretekk provider earnings are not enabled for this workspace yet.
        </Notice>
      );
    }

    return (
      <Notice title="We couldn't load your wallet." tone="warning">
        {walletQuery.error instanceof Error ? walletQuery.error.message : "Please try again shortly."}
      </Notice>
    );
  }

  const wallet = walletQuery.data;
  if (!wallet) {
    return null;
  }
  const transactions = transactionsQuery.data?.results ?? [];

  return (
    <div className="rounded-[8px] border border-white/70 bg-white p-5 shadow-[0_24px_64px_-42px_rgba(15,23,42,0.45)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-[var(--primary-soft)] text-[var(--primary)]">
            <WalletCards className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-semibold text-[#1F2937]">Wallet summary</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">Earnings and payout status.</p>
          </div>
        </div>
        <Badge tone={role === "doctor" ? "cyan" : "blue"}>{wallet.currency}</Badge>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MoneyCard label="Available balance" value={wallet.available_balance} currency={wallet.currency} description="Ready for payout." />
        <MoneyCard label="Pending earnings" value={wallet.pending_balance} currency={wallet.currency} description="Awaiting release." />
        <MoneyCard label="Lifetime earnings" value={wallet.lifetime_net_earning} currency={wallet.currency} description="Total earnings." />
        <MoneyCard label="Paid out" value={wallet.paid_out_balance} currency={wallet.currency} description="Total paid to you." />
      </div>

      {role === "doctor" ? null : <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[8px] border border-[#DBEAFE] bg-[#F8FBFF] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
            <Clock3 className="h-4 w-4" />
            Next payout date
          </div>
          <p className="mt-2 text-sm font-semibold text-[#1F2937]">{wallet.next_available_at ? formatDateTime(wallet.next_available_at) : "No payout date yet"}</p>
        </div>
        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CreditCard className="h-4 w-4" />
            Requested
          </div>
          <p className="mt-2 text-sm font-semibold text-[#1F2937]">{formatMoney(wallet.payout_requested_balance, wallet.currency)}</p>
        </div>
        <div className="rounded-[8px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Banknote className="h-4 w-4" />
            Refunds / disputes
          </div>
          <p className="mt-2 text-sm font-semibold text-[#1F2937]">
            {formatMoney(wallet.refunded_balance, wallet.currency)} refunded
          </p>
        </div>
      </div>}

      <div className={role === "doctor" ? "mt-4" : "mt-6"}>
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-[var(--primary)]" />
          <h3 className="font-heading text-lg font-semibold text-[#1F2937]">Recent activity</h3>
        </div>

        {transactionsQuery.isLoading ? (
          <InlineLoader compact label="Loading wallet history" />
        ) : transactionsQuery.isError ? (
          <Notice title="Wallet history could not load." tone="warning">
            {transactionsQuery.error instanceof Error ? transactionsQuery.error.message : "Please try again shortly."}
          </Notice>
        ) : transactions.length ? (
          <div className="grid gap-3">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="rounded-[8px] border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#1F2937]">{ledgerLabel(transaction.transaction_type)}</p>
                    <p className="mt-1 text-sm text-slate-600">{formatDateTime(transaction.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {transactionAmount(transaction) ? (
                      <span className="text-sm font-semibold text-[#1F2937]">{transactionAmount(transaction)}</span>
                    ) : null}
                    <Badge tone="neutral">{ledgerLabel(transaction.status)}</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No wallet activity yet" description="Earnings and payouts will appear here." />
        )}
      </div>
    </div>
  );
}
