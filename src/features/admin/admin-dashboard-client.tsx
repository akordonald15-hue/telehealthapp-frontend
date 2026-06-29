"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Banknote,
  CalendarClock,
  ClipboardList,
  Download,
  Home,
  MessageSquareText,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Notice } from "@/components/ui/notice";
import { Section } from "@/components/ui/section";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, extractErrorMessage } from "@/lib/api/client";
import { adminApi, appointmentsApi, auditApi, homeCareApi, paymentsApi, referralsApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import type { AdminDashboardResponse, AdminProvider, AdminProviderCreateResponse, AdminUser, HomeCareZone, Payment, ProviderAvailabilityStatus, ReferralStatus, UserRole } from "@/lib/types/backend";
import { paymentSummary } from "@/lib/ui/humanize";
import { formatDateTime, formatMoney } from "@/lib/utils";

const HOMECARE_ZONES: Array<{ value: HomeCareZone; label: string }> = [
  { value: "eket", label: "Eket" },
  { value: "uyo", label: "Uyo" },
];

function Metric({
  label,
  value,
  tone = "blue",
  icon: Icon,
}: {
  label: string;
  value: string | number;
  tone?: "blue" | "green" | "amber" | "rose" | "cyan";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClasses = {
    blue: "bg-blue-50 text-[#2563EB]",
    green: "bg-emerald-50 text-[#047857]",
    amber: "bg-amber-50 text-[#B45309]",
    rose: "bg-rose-50 text-[#BE123C]",
    cyan: "bg-cyan-50 text-[#0F766E]",
  };
  return (
    <div className="ct-surface rounded-[20px] p-4">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-1 font-heading text-[1.8rem] font-semibold text-[#1F2937]">{value}</p>
    </div>
  );
}

function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="ct-panel rounded-[24px] p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="ct-card-title text-[#1F2937]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ConfirmActionButton({
  label,
  title,
  description,
  confirmLabel = label,
  disabled,
  tone = "neutral",
  onConfirm,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel?: string;
  disabled?: boolean;
  tone?: "neutral" | "danger" | "primary";
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);
  const buttonClass =
    tone === "danger"
      ? "bg-rose-700 text-white hover:bg-rose-800"
      : tone === "primary"
        ? "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"
        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={`min-h-10 rounded-[12px] px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 disabled:opacity-50 ${buttonClass}`}
      >
        {label}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
          <div className="w-full max-w-md rounded-[24px] border border-white/70 bg-white p-5 shadow-2xl">
            <h3 id="admin-confirm-title" className="font-heading text-xl font-semibold text-[#1F2937]">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-h-10 rounded-[12px] border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
                className={`min-h-10 rounded-[12px] px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/15 ${tone === "danger" ? "bg-rose-700 text-white hover:bg-rose-800" : "bg-[#2563EB] text-white hover:bg-[#1D4ED8]"}`}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function AdminUserRow({ user }: { user: AdminUser }) {
  const queryClient = useQueryClient();
  const updateUser = useMutation({
    mutationFn: (body: Partial<Pick<AdminUser, "is_active" | "is_email_verified">>) => adminApi.updateUser(user.id, body),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
  const resetPassword = useMutation({
    mutationFn: () => adminApi.requestPasswordReset(user.id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });

  return (
    <article className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#1F2937]">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={user.role === "admin" ? "rose" : user.role === "doctor" ? "cyan" : user.role === "nurse" ? "green" : "blue"}>{user.role}</Badge>
            <Badge tone={user.is_active ? "green" : "rose"}>{user.is_active ? "active" : "inactive"}</Badge>
            <Badge tone={user.is_email_verified ? "green" : "amber"}>{user.is_email_verified ? "verified" : "unverified"}</Badge>
            {user.provider_status ? <Badge tone={user.provider_status === "suspended" ? "rose" : "neutral"}>{user.provider_status}</Badge> : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConfirmActionButton
            label={user.is_active ? "Deactivate" : "Activate"}
            title={user.is_active ? "Deactivate this account?" : "Activate this account?"}
            description={user.is_active ? "The user will no longer be able to use their Caretekk account until it is reactivated." : "The user will regain access to their Caretekk account."}
            tone={user.is_active ? "danger" : "neutral"}
            disabled={updateUser.isPending}
            onConfirm={() => updateUser.mutate({ is_active: !user.is_active })}
          />
          <ConfirmActionButton
            label={user.is_email_verified ? "Unverify" : "Verify"}
            title={user.is_email_verified ? "Mark email as unverified?" : "Verify this email?"}
            description={user.is_email_verified ? "The account will be marked as needing email verification again." : "The account email will be marked as verified."}
            disabled={updateUser.isPending}
            onConfirm={() => updateUser.mutate({ is_email_verified: !user.is_email_verified })}
          />
          <ConfirmActionButton
            label="Reset password"
            title="Send password reset?"
            description="Caretekk will start the password reset process for this user."
            tone="primary"
            disabled={resetPassword.isPending}
            onConfirm={() => resetPassword.mutate()}
          />
        </div>
      </div>
    </article>
  );
}

function ProviderRow({ provider }: { provider: AdminProvider }) {
  const queryClient = useQueryClient();
  const updateProvider = useMutation({
    mutationFn: (body: Parameters<typeof adminApi.updateProviderStatus>[2]) =>
      adminApi.updateProviderStatus(provider.provider_type, provider.id, body),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
  const resendInvite = useMutation({
    mutationFn: () => adminApi.resendProviderInvite(provider.provider_type, provider.id),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });
  const setAvailability = (availability_status: ProviderAvailabilityStatus) => updateProvider.mutate({ availability_status });

  return (
    <article className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#1F2937]">{provider.display_name}</p>
          <p className="mt-1 truncate text-xs text-slate-500">{provider.user_email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge tone={provider.provider_type === "doctor" ? "cyan" : "green"}>{provider.provider_type}</Badge>
            <StatusBadge value={provider.availability_status} />
            <Badge tone={provider.is_active ? "green" : "rose"}>{provider.is_active ? "active" : "inactive"}</Badge>
            {provider.onboarding_status ? <StatusBadge value={provider.onboarding_status} /> : null}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Active workload: {provider.active_workload} | Completed: {provider.completed_workload}
            {provider.rating ? ` | Rating: ${provider.rating}` : ""}
          </p>
          {provider.provider_type === "nurse" ? (
            <p className="mt-1 text-xs font-semibold text-slate-600">
              Zone: {provider.service_zone_label || "Zone not set"}
              {provider.base_address ? ` | Base: ${provider.base_address}` : ""}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-slate-500">
            {provider.active_job_label}
            {provider.last_active_at ? ` | Last active ${formatDateTime(provider.last_active_at)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ConfirmActionButton
            label="Online"
            title="Set provider online?"
            description="This provider will appear available for matching when other eligibility rules allow it."
            disabled={updateProvider.isPending}
            onConfirm={() => setAvailability("available")}
          />
          <ConfirmActionButton
            label="Offline"
            title="Set provider offline?"
            description="This provider will stop appearing as available for new patient selections."
            disabled={updateProvider.isPending}
            onConfirm={() => setAvailability("offline")}
          />
          <ConfirmActionButton
            label={provider.is_active ? "Suspend" : "Unsuspend"}
            title={provider.is_active ? "Suspend this provider?" : "Unsuspend this provider?"}
            description={provider.is_active ? "The provider will be taken offline and blocked from active dispatch or booking selection." : "The provider can return to availability and operational workflows."}
            tone={provider.is_active ? "danger" : "primary"}
            disabled={updateProvider.isPending}
            onConfirm={() => updateProvider.mutate({ is_active: !provider.is_active, availability_status: provider.is_active ? "offline" : "available" })}
          />
          <ConfirmActionButton
            label="Resend setup email"
            title="Queue another provider setup email?"
            description="Caretekk will queue a fresh password setup code for this provider."
            tone="primary"
            disabled={resendInvite.isPending}
            onConfirm={() => resendInvite.mutate()}
          />
          {provider.provider_type === "nurse" ? (
            <>
              {HOMECARE_ZONES.map((item) => (
                <ConfirmActionButton
                  key={item.value}
                  label={`Zone: ${item.label}`}
                  title={`Set nurse zone to ${item.label}?`}
                  description="This controls where the nurse appears for patient home care bookings."
                  tone="primary"
                  disabled={updateProvider.isPending || provider.service_zone === item.value}
                  onConfirm={() => updateProvider.mutate({ service_zone: item.value })}
                />
              ))}
              <ConfirmActionButton
                label="Approve"
                title="Approve this nurse?"
                description="The nurse will be approved and marked active for dispatch."
                tone="primary"
                disabled={updateProvider.isPending || !provider.service_zone}
                onConfirm={() => updateProvider.mutate({ onboarding_status: "approved", active_for_dispatch: true })}
              />
            </>
          ) : null}
        </div>
      </div>
      {resendInvite.isError ? (
        <Notice title="Provider setup email could not be queued." tone="warning">
          {resendInvite.error instanceof ApiError ? extractErrorMessage(resendInvite.error.payload) || resendInvite.error.message : "Please try again."}
        </Notice>
      ) : null}
      {resendInvite.isSuccess ? (
        <Notice title="Provider setup email queued." tone="success">
          Caretekk queued a fresh setup code for this provider.
        </Notice>
      ) : null}
    </article>
  );
}

function ProviderCreatePanel() {
  const queryClient = useQueryClient();
  const [created, setCreated] = useState<AdminProviderCreateResponse | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    role: "doctor" as "doctor" | "nurse",
    name: "",
    email: "",
    phone: "",
    specialty: "General Medicine",
    service_type: "Home care nursing",
    service_zone: "eket" as HomeCareZone,
    base_address: "",
    availability_status: "offline" as ProviderAvailabilityStatus,
    provider_status: "pending" as "pending" | "approved" | "suspended",
    active_for_dispatch: false,
    is_active: true,
    is_email_verified: true,
  });
  const createProvider = useMutation({
    mutationFn: () =>
      adminApi.createProvider({
        role: form.role,
        name: form.name,
        email: form.email,
        phone: form.phone,
        specialty: form.role === "doctor" ? form.specialty : undefined,
        service_type: form.role === "nurse" ? form.service_type : undefined,
        service_zone: form.role === "nurse" ? form.service_zone : undefined,
        base_address: form.role === "nurse" ? form.base_address : undefined,
        availability_status: form.availability_status,
        provider_status: form.role === "nurse" ? form.provider_status : undefined,
        active_for_dispatch: form.role === "nurse" ? form.active_for_dispatch : undefined,
        is_active: form.is_active,
        is_email_verified: form.is_email_verified,
      }),
    onSuccess: async (data) => {
      setCreated(data);
      setCreateError(null);
      setForm((current) => ({ ...current, name: "", email: "", phone: "", base_address: "" }));
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (error) => {
      setCreated(null);
      if (error instanceof ApiError) {
        setCreateError(extractErrorMessage(error.payload) || error.message);
        return;
      }
      setCreateError("We couldn't create this provider right now.");
    },
  });

  return (
    <Panel title="Create provider account">
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setCreated(null);
          setCreateError(null);
          createProvider.mutate();
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Role
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as "doctor" | "nurse" }))}
              className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937]"
            >
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Name
            <input
              required
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937]"
              placeholder={form.role === "doctor" ? "Dr. Ada Care" : "Nurse Ada Care"}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937]"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Phone
            <input
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937]"
            />
          </label>
          {form.role === "doctor" ? (
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Specialty
              <input
                required
                value={form.specialty}
                onChange={(event) => setForm((current) => ({ ...current, specialty: event.target.value }))}
                className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937]"
              />
            </label>
          ) : (
            <label className="grid gap-1 text-sm font-semibold text-slate-600">
              Service type
              <input
                required
                value={form.service_type}
                onChange={(event) => setForm((current) => ({ ...current, service_type: event.target.value }))}
                className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937]"
              />
            </label>
          )}
          {form.role === "nurse" ? (
            <>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                Service zone
                <select
                  required
                  value={form.service_zone}
                  onChange={(event) => setForm((current) => ({ ...current, service_zone: event.target.value as HomeCareZone }))}
                  className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937]"
                >
                  {HOMECARE_ZONES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-600">
                Base address
                <input
                  value={form.base_address}
                  onChange={(event) => setForm((current) => ({ ...current, base_address: event.target.value }))}
                  className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937]"
                  placeholder="Optional nurse base address"
                />
              </label>
            </>
          ) : null}
          <label className="grid gap-1 text-sm font-semibold text-slate-600">
            Availability
            <select
              value={form.availability_status}
              onChange={(event) => setForm((current) => ({ ...current, availability_status: event.target.value as ProviderAvailabilityStatus }))}
              className="min-h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-[#1F2937]"
            >
              <option value="offline">Offline</option>
              <option value="available">Available</option>
              <option value="on_break">On break</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-3 rounded-[16px] border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-600">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} />
            Active
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={form.is_email_verified} onChange={(event) => setForm((current) => ({ ...current, is_email_verified: event.target.checked }))} />
            Verified
          </label>
          {form.role === "nurse" ? (
            <>
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={form.active_for_dispatch} onChange={(event) => setForm((current) => ({ ...current, active_for_dispatch: event.target.checked }))} />
                Dispatch active
              </label>
              <select
                value={form.provider_status}
                onChange={(event) => setForm((current) => ({ ...current, provider_status: event.target.value as "pending" | "approved" | "suspended" }))}
                className="min-h-9 rounded-[10px] border border-slate-200 bg-white px-2"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="suspended">Suspended</option>
              </select>
            </>
          ) : null}
        </div>
        {createError ? <Notice title="Provider could not be created." tone="warning">{createError}</Notice> : null}
        {created ? (
          <Notice title="Provider created. Setup email queued." tone="success">
            <div className="grid gap-1">
              <span>{created.email}</span>
              <span className="text-xs text-slate-600">
                Caretekk queued a secure password setup code for this provider.
              </span>
            </div>
          </Notice>
        ) : null}
        <button type="submit" disabled={createProvider.isPending} className="min-h-11 rounded-[12px] bg-[#2563EB] px-4 text-sm font-extrabold text-white disabled:opacity-50">
          {createProvider.isPending ? "Creating..." : "Create provider"}
        </button>
      </form>
    </Panel>
  );
}

function ManualPaymentRow({ payment }: { payment: Payment }) {
  const queryClient = useQueryClient();
  const confirmPayment = useMutation({
    mutationFn: () => adminApi.confirmManualPayment(payment.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "manual-payments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "appointments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "homecare"] });
    },
  });
  const rejectPayment = useMutation({
    mutationFn: () => adminApi.rejectManualPayment(payment.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "manual-payments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "payments"] });
      await queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  const bookingLabel = payment.appointment ? `Doctor consultation #${payment.appointment}` : payment.homecare_request ? `Home care request #${payment.homecare_request}` : "Service booking";

  return (
    <article className="rounded-[16px] border border-amber-100 bg-amber-50/70 p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#1F2937]">{formatMoney(payment.amount, payment.currency)}</p>
          <p className="mt-1 break-words text-xs text-slate-600">
            Reference: {payment.external_ref || payment.bank_transfer?.reference || "No reference"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {payment.patient_name || `Patient #${payment.patient}`} {payment.patient_phone ? `| ${payment.patient_phone}` : ""}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {bookingLabel}
            {payment.transfer_notified_at ? ` | Payment notice ${formatDateTime(payment.transfer_notified_at)}` : ""}
          </p>
          <div className="mt-2">
            {payment.transfer_proof_uploaded ? (
              <a
                href={payment.transfer_proof_url || `/api/admin/payments/${payment.id}/proof/`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-8 items-center rounded-[8px] border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
              >
                View payment proof
              </a>
            ) : (
              <p className="text-xs font-semibold text-amber-700">No payment proof uploaded.</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge value={payment.status} />
          <ConfirmActionButton
            label="Confirm Payment"
            title="Confirm this bank transfer?"
            description="Confirm only after the bank inflow has been checked. This unlocks the booked service."
            tone="primary"
            disabled={confirmPayment.isPending || rejectPayment.isPending}
            onConfirm={() => confirmPayment.mutate()}
          />
          <ConfirmActionButton
            label="Reject"
            title="Reject this payment notification?"
            description="The booking will stay locked and the patient can contact Caretekk support or submit again."
            tone="danger"
            disabled={confirmPayment.isPending || rejectPayment.isPending}
            onConfirm={() => rejectPayment.mutate()}
          />
        </div>
      </div>
      {confirmPayment.isError || rejectPayment.isError ? (
        <Notice title="Payment review action failed." tone="warning">
          Please refresh and try again.
        </Notice>
      ) : null}
    </article>
  );
}

function exportFinancialReport(data?: AdminDashboardResponse) {
  if (!data || typeof window === "undefined") return;
  const payload = JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      overview: data.overview,
      weekly_revenue: data.analytics.weekly_revenue,
    },
    null,
    2,
  );
  const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "caretekk-financial-report.json";
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminDashboardClient() {
  const userQuery = useCurrentUser();
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const dashboard = useQuery({ queryKey: ["admin", "dashboard"], queryFn: adminApi.dashboard, enabled: userQuery.data?.role === "admin" });
  const users = useQuery({
    queryKey: ["admin", "users", roleFilter],
    queryFn: () => adminApi.users({ page_size: 8, role: roleFilter || undefined }),
    enabled: userQuery.data?.role === "admin",
  });
  const providers = useQuery({ queryKey: ["admin", "providers"], queryFn: () => adminApi.providers({ page_size: 12 }), enabled: userQuery.data?.role === "admin" });
  const appointments = useQuery({ queryKey: ["admin", "appointments"], queryFn: () => appointmentsApi.list({ page_size: 6 }), enabled: userQuery.data?.role === "admin" });
  const homecare = useQuery({ queryKey: ["admin", "homecare"], queryFn: () => homeCareApi.requests({ page_size: 6 }), enabled: userQuery.data?.role === "admin" });
  const payments = useQuery({ queryKey: ["admin", "payments"], queryFn: () => paymentsApi.list({ page_size: 6 }), enabled: userQuery.data?.role === "admin" });
  const manualPayments = useQuery({ queryKey: ["admin", "manual-payments"], queryFn: () => adminApi.pendingManualPayments({ page_size: 20 }), enabled: userQuery.data?.role === "admin" });
  const referrals = useQuery({ queryKey: ["admin", "referrals"], queryFn: () => referralsApi.list({ page_size: 8 }), enabled: userQuery.data?.role === "admin" });
  const audit = useQuery({ queryKey: ["admin", "audit"], queryFn: () => auditApi.list({ page_size: 6 }), enabled: userQuery.data?.role === "admin" });
  const updateReferral = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ReferralStatus }) => referralsApi.update(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["admin", "referrals"] });
    },
  });

  if (userQuery.data && userQuery.data.role !== "admin") {
    return (
      <Section title="Admin dashboard" description="This workspace is available for Caretekk admin accounts only.">
        <Notice title="Admin access required">Sign in with an admin account to view platform operations.</Notice>
      </Section>
    );
  }

  const overview = dashboard.data?.overview;

  return (
    <Section
      title="Admin dashboard"
      description="Monitor platform operations, provider readiness, bookings, finances, communications, and audit activity."
      action={<Badge tone="rose">Admin only</Badge>}
    >
      {dashboard.isError ? <Notice title="Dashboard data is temporarily unavailable." tone="warning">Some admin metrics could not be loaded.</Notice> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Patients" value={overview?.total_patients ?? "..."} icon={Users} />
        <Metric label="Doctors" value={overview?.total_doctors ?? "..."} icon={Stethoscope} tone="cyan" />
        <Metric label="Nurses" value={overview?.total_nurses ?? "..."} icon={Home} tone="green" />
        <Metric label="Platform revenue" value={overview ? formatMoney(overview.total_platform_revenue) : "..."} icon={Banknote} tone="green" />
        <Metric label="Active consultations" value={overview?.active_consultations ?? "..."} icon={CalendarClock} />
        <Metric label="Active homecare" value={overview?.active_homecare_requests ?? "..."} icon={ClipboardList} tone="cyan" />
        <Metric label="Pending provider earnings" value={overview ? formatMoney(overview.pending_provider_earnings) : "..."} icon={Activity} tone="amber" />
        <Metric label="Failed payments" value={overview?.failed_payments ?? "..."} icon={ShieldCheck} tone={overview?.failed_payments ? "rose" : "green"} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <Panel title="User management" action={<RoleFilter value={roleFilter} onChange={setRoleFilter} />}>
          <div className="grid gap-3">
            {users.data?.results.length ? users.data.results.map((user) => <AdminUserRow key={user.id} user={user} />) : <EmptyState title="No users found" description="Users matching the current filter will appear here." />}
          </div>
        </Panel>

        <ProviderCreatePanel />
      </div>

      <Panel title="Provider management">
        <div className="grid gap-3">
          {providers.data?.results.length ? providers.data.results.map((provider) => <ProviderRow key={`${provider.provider_type}-${provider.id}`} provider={provider} />) : <EmptyState title="No providers found" description="Doctor and nurse providers will appear here." />}
        </div>
      </Panel>

      <Panel title="Referral queue">
        {updateReferral.isError ? <Notice title="Referral status was not updated" tone="warning">Please try again in a moment.</Notice> : null}
        <div className="grid gap-3">
          {referrals.data?.results.length ? referrals.data.results.map((referral) => (
            <article key={referral.id} className="rounded-[18px] border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1F2937]">{referral.referred_to}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {referral.patient_name || `Patient #${referral.patient}`} | {referral.doctor_name || `Doctor #${referral.doctor}`} | {referral.created_at ? formatDateTime(referral.created_at) : "No date"}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <StatusBadge value={referral.status} />
                  <select
                    value={referral.status}
                    disabled={updateReferral.isPending}
                    onChange={(event) => updateReferral.mutate({ id: referral.id, status: event.target.value as ReferralStatus })}
                    className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="contacted">Contacted</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </article>
          )) : <EmptyState title="No referrals found" description="Consultation-linked referrals will appear here." />}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Booking management">
          <div className="grid gap-3">
            <h3 className="text-sm font-bold text-slate-500">Appointments</h3>
            {appointments.data?.results.map((appointment) => (
              <div key={appointment.id} className="flex flex-col gap-2 rounded-[16px] border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold text-[#1F2937]">#{appointment.id} | {formatDateTime(appointment.scheduled_at)}</span>
                <StatusBadge value={appointment.status} />
              </div>
            ))}
            <h3 className="mt-3 text-sm font-bold text-slate-500">Homecare</h3>
            {homecare.data?.results.map((request) => (
              <div key={request.id} className="flex flex-col gap-2 rounded-[16px] border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold text-[#1F2937]">#{request.id} | {request.service_address_snapshot || "No address"}</span>
                <StatusBadge value={request.status} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          title="Financial management"
          action={
            <button type="button" onClick={() => exportFinancialReport(dashboard.data)} className="inline-flex min-h-10 items-center gap-2 rounded-[12px] bg-[#2563EB] px-3 text-sm font-extrabold text-white">
              <Download className="h-4 w-4" /> Export
            </button>
          }
        >
          <div className="grid gap-3">
            <div className="rounded-[18px] border border-amber-100 bg-white p-3">
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-bold text-[#1F2937]">Payments - Pending Manual Verification</h3>
                <Badge tone="amber">{manualPayments.data?.results.length ?? 0} pending</Badge>
              </div>
              <div className="grid gap-3">
                {manualPayments.isError ? (
                  <Notice title="Payment queue unavailable." tone="warning">Please try again.</Notice>
                ) : manualPayments.data?.results.length ? (
                  manualPayments.data.results.map((payment) => <ManualPaymentRow key={payment.id} payment={payment} />)
                ) : (
                  <EmptyState title="No pending manual payments" description="Patient bank-transfer notifications will appear here." />
                )}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Metric label="Provider payouts" value={overview ? formatMoney(overview.total_provider_payouts) : "..."} icon={Banknote} tone="green" />
              <Metric label="Refunded payments" value={overview?.refunded_payments ?? "..."} icon={Activity} tone="amber" />
              <Metric label="Disputes" value={overview?.unresolved_disputes ?? "..."} icon={ShieldCheck} tone={overview?.unresolved_disputes ? "rose" : "green"} />
            </div>
            {payments.data?.results.map((payment) => (
              <div key={payment.id} className="flex flex-col gap-2 rounded-[16px] border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold text-[#1F2937]">{formatMoney(payment.amount, payment.currency)} | {paymentSummary(payment.provider, "admin")}</span>
                <StatusBadge value={payment.status} />
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Communication monitoring">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Open threads" value={dashboard.data?.operations.open_threads ?? "..."} icon={MessageSquareText} />
            <Metric label="Pending refunds" value={dashboard.data?.operations.pending_refunds ?? "..."} icon={Banknote} tone="amber" />
            <Metric label="Audit events" value={dashboard.data?.operations.recent_audit_events ?? "..."} icon={ShieldCheck} tone="cyan" />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">Conversation content remains governed by existing messaging permissions. Escalation queues can be added here when support-ticket workflow is introduced.</p>
        </Panel>

        <Panel title="Audit and activity logs">
          <div className="grid gap-3">
            {audit.data?.results.map((event) => (
              <div key={event.id} className="rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-[#1F2937]">{event.action}</p>
                <p className="mt-1 text-xs text-slate-500">{event.object_type} #{event.object_id} | {formatDateTime(event.created_at)}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Analytics">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-slate-500">Weekly revenue</h3>
            <div className="mt-3 grid gap-2">
              {dashboard.data?.analytics.weekly_revenue.map((row) => (
                <div key={row.week} className="flex items-center justify-between rounded-[14px] bg-slate-50 px-3 py-2 text-sm">
                  <span>{row.week}</span>
                  <strong>{formatMoney(row.amount)}</strong>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-500">Top providers</h3>
            <div className="mt-3 grid gap-2">
              {dashboard.data?.analytics.top_doctors.map((doctor) => (
                <div key={`doctor-${doctor.id}`} className="rounded-[14px] bg-slate-50 px-3 py-2 text-sm">
                  <strong>{doctor.display_name}</strong> | {doctor.completed_consultations} completed
                </div>
              ))}
              {dashboard.data?.analytics.top_nurses.map((nurse) => (
                <div key={`nurse-${nurse.id}`} className="rounded-[14px] bg-slate-50 px-3 py-2 text-sm">
                  <strong>{nurse.email}</strong> | {nurse.completed_visits} visits{nurse.rating ? ` | ${nurse.rating}/5` : ""}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone="amber">Appointment cancellation {dashboard.data?.analytics.appointment_cancellation_rate ?? 0}%</Badge>
          <Badge tone="amber">Homecare cancellation {dashboard.data?.analytics.homecare_cancellation_rate ?? 0}%</Badge>
        </div>
      </Panel>
    </Section>
  );
}

function RoleFilter({ value, onChange }: { value: UserRole | ""; onChange: (value: UserRole | "") => void }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as UserRole | "")}
      className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700"
    >
      <option value="">All roles</option>
      <option value="patient">Patients</option>
      <option value="doctor">Doctors</option>
      <option value="nurse">Nurses</option>
      <option value="admin">Admins</option>
    </select>
  );
}
