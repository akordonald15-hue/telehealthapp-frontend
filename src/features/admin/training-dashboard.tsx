"use client";

import { useState } from "react";
import { Activity, Banknote, CalendarClock, ClipboardList, Home, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { formatMoney } from "@/lib/utils";
import { dashboardNames } from "./dashboard-names";

// Training fixtures only. These accounts and events are not fetched from production.
const users = dashboardNames.map((name, index) => ({
  email: `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
  role: index < 204 ? "Patient" : index < 228 ? "Doctor" : "Nurse",
  status: index === 2 ? "Verified" : index === 5 || (index + 1) % 13 === 0 ? "Pending" : "Active",
}));

const auditEvents = [
  { action: "User registered", actor: users[0].email, object: "Patient account", time: "Today, 09:42" },
  { action: "Provider verified", actor: "admin.ops@gmail.com", object: users[2].email, time: "Today, 09:18" },
  { action: "Booking completed", actor: users[1].email, object: "Consultation #CT-1048", time: "Yesterday, 16:30" },
  { action: "Payment recorded", actor: "admin.ops@gmail.com", object: "Payment #CT-2084", time: "Yesterday, 14:05" },
  { action: "Provider status changed", actor: "admin.ops@gmail.com", object: users[4].email, time: "Yesterday, 11:24" },
];

const previousDoctorRevenue = 60_000;
const previousNurseRevenue = 20_000;
const previousRevenue = previousDoctorRevenue + previousNurseRevenue;
const olderWeekDoctorRevenue = 20_000;
const olderWeekNurseRevenue = 23_000;
const olderWeekRevenue = olderWeekDoctorRevenue + olderWeekNurseRevenue;
const lastWeekDoctorCount = 4;
const lastWeekDoctorRevenue = 8_000;
const lastWeekNurseRevenue = 10_000;
const lastWeekRevenue = lastWeekDoctorRevenue + lastWeekNurseRevenue;
const thisWeekDoctorCount = 5;
const thisWeekDoctorRevenue = 10_000;
const thisWeekNurseRevenue = 20_000;
const thisWeekRevenue = thisWeekDoctorRevenue + thisWeekNurseRevenue;

function calculateRevenueSplit(doctorRevenue: number, nurseRevenue: number) {
  const doctorGross = doctorRevenue * 0.7;
  const nurseGross = nurseRevenue * 0.65;
  const maintenance = (doctorGross + nurseGross) * 0.05;
  return {
    providerEarnings: doctorGross + nurseGross - maintenance,
    platformShare: doctorRevenue * 0.3 + nurseRevenue * 0.35,
    maintenance,
  };
}

const previousSplit = calculateRevenueSplit(previousDoctorRevenue, previousNurseRevenue);
const olderWeekSplit = calculateRevenueSplit(olderWeekDoctorRevenue, olderWeekNurseRevenue);
const lastWeekSplit = calculateRevenueSplit(lastWeekDoctorRevenue, lastWeekNurseRevenue);
const thisWeekSplit = calculateRevenueSplit(thisWeekDoctorRevenue, thisWeekNurseRevenue);
const revenueBeforeLastWeek = previousRevenue + olderWeekRevenue;
const totalRevenue = revenueBeforeLastWeek + lastWeekRevenue + thisWeekRevenue;
const cumulativeProviderEarnings = previousSplit.providerEarnings + olderWeekSplit.providerEarnings + lastWeekSplit.providerEarnings + thisWeekSplit.providerEarnings;
const cumulativePlatformShare = previousSplit.platformShare + olderWeekSplit.platformShare + lastWeekSplit.platformShare + thisWeekSplit.platformShare;
const cumulativeMaintenance = previousSplit.maintenance + olderWeekSplit.maintenance + lastWeekSplit.maintenance + thisWeekSplit.maintenance;
const financialHistory = [
  { period: "Opening balance", activity: "Existing doctor and home-care revenue", revenue: previousRevenue, split: previousSplit, runningRevenue: previousRevenue },
  { period: "Earlier week", activity: "10 doctor consultations · 3 home-care visits", revenue: olderWeekRevenue, split: olderWeekSplit, runningRevenue: revenueBeforeLastWeek },
  { period: "Last week", activity: "4 doctor consultations · 1 home-care visit", revenue: lastWeekRevenue, split: lastWeekSplit, runningRevenue: revenueBeforeLastWeek + lastWeekRevenue },
  { period: "This week", activity: "5 doctor consultations · 1 home-care visit", revenue: thisWeekRevenue, split: thisWeekSplit, runningRevenue: totalRevenue },
];

function Metric({ label, value, icon: Icon, tone = "blue" }: {
  label: string; value: string | number; icon: React.ComponentType<{ className?: string }>;
  tone?: "blue" | "green" | "amber" | "cyan";
}) {
  const colors = { blue: "bg-blue-50 text-[#2563EB]", green: "bg-emerald-50 text-[#047857]", amber: "bg-amber-50 text-[#B45309]", cyan: "bg-cyan-50 text-[#0F766E]" };
  return <div className="ct-surface rounded-[20px] p-4">
    <span className={`flex h-10 w-10 items-center justify-center rounded-[14px] ${colors[tone]}`}><Icon className="h-5 w-5" /></span>
    <p className="mt-4 text-sm font-semibold text-slate-500">{label}</p>
    <p className="mt-1 font-heading text-[1.8rem] font-semibold text-[#1F2937]">{value}</p>
  </div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="ct-panel rounded-[24px] p-5"><h2 className="ct-card-title mb-4 text-[#1F2937]">{title}</h2>{children}</section>;
}

export function TrainingDashboard() {
  const [filter, setFilter] = useState("All roles");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const visibleUsers = users.filter((item) => (filter === "All roles" || item.role === filter) && item.email.includes(search.trim().toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleUsers.length / 10));
  const pagedUsers = visibleUsers.slice((page - 1) * 10, page * 10);
  return <Section
    title="Admin dashboard"
    description="Monitor platform operations, users, finances, and audit activity."
    action={<Badge tone="rose">Admin only</Badge>}
  >
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Users" value={users.length} icon={Users} />
      <Metric label="Doctors" value={24} icon={Stethoscope} tone="cyan" />
      <Metric label="Nurses" value={16} icon={Home} tone="green" />
      <Metric label="Platform revenue" value={formatMoney(totalRevenue)} icon={Banknote} tone="green" />
      <Metric label="Active consultations" value={12} icon={CalendarClock} />
      <Metric label="Active homecare" value={8} icon={ClipboardList} tone="cyan" />
      <Metric label="Provider earnings" value={formatMoney(cumulativeProviderEarnings)} icon={Activity} tone="amber" />
      <Metric label="Audit events" value={auditEvents.length} icon={ShieldCheck} tone="cyan" />
    </div>

    <Panel title="Revenue activity">
      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-heading text-lg font-semibold text-[#1F2937]">Last week</h3><Badge tone="blue">{formatMoney(lastWeekRevenue)}</Badge></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-[18px] border border-cyan-100 bg-white p-4">
              <p className="text-sm font-bold text-[#1F2937]">Doctor consultations</p><p className="mt-1 text-xs text-slate-500">{lastWeekDoctorCount} consultations · {formatMoney(lastWeekDoctorRevenue)} total</p>
              <p className="mt-4 font-heading text-2xl font-semibold text-[#1F2937]">{formatMoney(lastWeekDoctorRevenue)}</p>
            </article>
            <article className="rounded-[18px] border border-emerald-100 bg-white p-4">
              <p className="text-sm font-bold text-[#1F2937]">Home-care visit</p><p className="mt-1 text-xs text-slate-500">1 completed visit</p>
              <p className="mt-4 font-heading text-2xl font-semibold text-[#1F2937]">{formatMoney(lastWeekNurseRevenue)}</p>
            </article>
          </div>
        </section>
        <section className="rounded-[20px] border border-blue-200 bg-blue-50/50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-heading text-lg font-semibold text-[#1F2937]">This week</h3><Badge tone="green">{formatMoney(thisWeekRevenue)}</Badge></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-[18px] border border-cyan-100 bg-white p-4">
              <p className="text-sm font-bold text-[#1F2937]">Doctor consultations</p><p className="mt-1 text-xs text-slate-500">{thisWeekDoctorCount} consultations · {formatMoney(thisWeekDoctorRevenue)} total</p>
              <p className="mt-4 font-heading text-2xl font-semibold text-[#1F2937]">{formatMoney(thisWeekDoctorRevenue)}</p>
            </article>
            <article className="rounded-[18px] border border-emerald-100 bg-white p-4">
              <p className="text-sm font-bold text-[#1F2937]">Home-care visit</p><p className="mt-1 text-xs text-slate-500">1 completed visit</p>
              <p className="mt-4 font-heading text-2xl font-semibold text-[#1F2937]">{formatMoney(thisWeekNurseRevenue)}</p>
            </article>
          </div>
        </section>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] bg-slate-100 px-4 py-4"><p className="text-xs font-semibold text-slate-500">Revenue before last week</p><strong className="mt-1 block font-heading text-xl text-[#1F2937]">{formatMoney(revenueBeforeLastWeek)}</strong></div>
        <div className="rounded-[18px] bg-blue-50 px-4 py-4"><p className="text-xs font-semibold text-[#2563EB]">Last two weeks added</p><strong className="mt-1 block font-heading text-xl text-[#1F2937]">{formatMoney(lastWeekRevenue + thisWeekRevenue)}</strong></div>
        <div className="rounded-[18px] bg-[#1F2937] px-4 py-4 text-white"><p className="text-xs font-semibold text-slate-300">Cumulative revenue</p><strong className="mt-1 block font-heading text-xl">{formatMoney(totalRevenue)}</strong></div>
      </div>
    </Panel>

    <Panel title="Financial history">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-left text-sm">
          <thead className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th className="px-3 py-2">Period</th><th className="px-3 py-2">Activity</th><th className="px-3 py-2">Revenue</th><th className="px-3 py-2">Provider net</th><th className="px-3 py-2">Platform share</th><th className="px-3 py-2">Maintenance</th><th className="px-3 py-2">Running revenue</th></tr>
          </thead>
          <tbody>{financialHistory.map((entry) => <tr key={entry.period} className="bg-slate-50 text-slate-700">
            <td className="rounded-l-[14px] px-3 py-3 font-bold text-[#1F2937]">{entry.period}</td>
            <td className="px-3 py-3 text-xs text-slate-500">{entry.activity}</td>
            <td className="px-3 py-3 font-semibold">{formatMoney(entry.revenue)}</td>
            <td className="px-3 py-3">{formatMoney(entry.split.providerEarnings)}</td>
            <td className="px-3 py-3">{formatMoney(entry.split.platformShare)}</td>
            <td className="px-3 py-3">{formatMoney(entry.split.maintenance)}</td>
            <td className="rounded-r-[14px] px-3 py-3 font-bold text-[#1F2937]">{formatMoney(entry.runningRevenue)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </Panel>

    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="User management">
        <div className="mb-3 flex flex-wrap gap-2"><label className="text-sm font-semibold text-slate-500">Role <select aria-label="Filter users by role" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} className="ml-2 min-h-10 rounded-[12px] border border-slate-200 bg-white px-3 text-slate-700">{["All roles", "Patient", "Doctor", "Nurse"].map((role) => <option key={role}>{role}</option>)}</select></label><input aria-label="Search accounts" placeholder="Search email" value={search} onChange={(event) => { setSearch(event.target.value.toLowerCase()); setPage(1); }} className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-slate-700" /></div>
        <div className="grid gap-3">{pagedUsers.map((item) => <article key={item.email} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"><p className="break-all text-sm font-bold text-[#1F2937]">{item.email}</p><div className="mt-2 flex gap-2"><Badge tone="blue">{item.role}</Badge><Badge tone={item.status === "Pending" ? "amber" : "green"}>{item.status}</Badge></div></article>)}</div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500"><span>{visibleUsers.length} of {users.length} users · Page {page} of {pageCount}</span><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous</button><button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button></div></div>
      </Panel>
      <Panel title="Financial management">
        <div className="grid gap-3 sm:grid-cols-2"><Metric label="Cumulative provider earnings" value={formatMoney(cumulativeProviderEarnings)} icon={Activity} tone="amber" /><Metric label="Cumulative platform share" value={formatMoney(cumulativePlatformShare)} icon={Banknote} tone="green" /></div>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <p className="flex justify-between gap-3"><span>Last week&apos;s provider earnings</span><strong>{formatMoney(lastWeekSplit.providerEarnings)}</strong></p>
          <p className="flex justify-between gap-3"><span>This week&apos;s provider earnings</span><strong>{formatMoney(thisWeekSplit.providerEarnings)}</strong></p>
          <p className="flex justify-between gap-3 border-t border-slate-200 pt-3"><span>Cumulative maintenance deduction</span><strong>{formatMoney(cumulativeMaintenance)}</strong></p>
          <p className="border-t border-slate-200 pt-3 text-xs text-slate-500">Doctor share: 70% of bookings; nurse share: 65%. A 5% maintenance deduction applies to each provider share.</p>
        </div>
      </Panel>
    </div>

    <Panel title="Audit and activity logs">
      <div className="grid gap-3">{auditEvents.map((event) => <article key={`${event.action}-${event.time}`} className="rounded-[16px] border border-slate-200 bg-slate-50 p-3"><p className="text-sm font-semibold text-[#1F2937]">{event.action}</p><p className="mt-1 break-all text-xs text-slate-500">{event.actor} | {event.object} | {event.time}</p></article>)}</div>
    </Panel>
  </Section>;
}
