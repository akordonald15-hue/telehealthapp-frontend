"use client";

import { useState } from "react";
import { Activity, Banknote, CalendarClock, ClipboardList, Home, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";
import { formatMoney } from "@/lib/utils";
import { dashboardNames } from "./dashboard-names";

// Training fixtures only. These accounts and events are not fetched from production.
const firstRoles = ["Patient", "Patient", "Doctor", "Doctor", "Nurse", "Patient"];
const users = dashboardNames.map((name, index) => ({
  email: `${name.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
  role: firstRoles[index] ?? (index < 163 ? "Patient" : index < 185 ? "Doctor" : "Nurse"),
  status: index === 2 ? "Verified" : index === 5 || (index + 1) % 13 === 0 ? "Pending" : "Active",
}));

const auditEvents = [
  { action: "User registered", actor: users[0].email, object: "Patient account", time: "Today, 09:42" },
  { action: "Provider verified", actor: "admin.ops@gmail.com", object: users[2].email, time: "Today, 09:18" },
  { action: "Booking completed", actor: users[1].email, object: "Consultation #CT-1048", time: "Yesterday, 16:30" },
  { action: "Payment recorded", actor: "admin.ops@gmail.com", object: "Payment #CT-2084", time: "Yesterday, 14:05" },
  { action: "Provider status changed", actor: "admin.ops@gmail.com", object: users[4].email, time: "Yesterday, 11:24" },
];

const doctorConsultationCount = 10;
const doctorConsultationPrice = 2_000;
const homeCareVisitPrices = [8_000, 10_000, 5_000];
const previousDoctorRevenue = 60_000;
const previousNurseRevenue = 20_000;
const previousRevenue = previousDoctorRevenue + previousNurseRevenue;
const doctorRevenue = doctorConsultationCount * doctorConsultationPrice;
const nurseRevenue = homeCareVisitPrices.reduce((total, price) => total + price, 0);
const weeklyRevenue = doctorRevenue + nurseRevenue;
const totalRevenue = previousRevenue + weeklyRevenue;
const weeklyDoctorGross = doctorRevenue * 0.7;
const weeklyNurseGross = nurseRevenue * 0.65;
const weeklyMaintenance = (weeklyDoctorGross + weeklyNurseGross) * 0.05;
const weeklyProviderEarnings = weeklyDoctorGross + weeklyNurseGross - weeklyMaintenance;
const weeklyPlatformShare = doctorRevenue * 0.3 + nurseRevenue * 0.35;
const previousDoctorGross = previousDoctorRevenue * 0.7;
const previousNurseGross = previousNurseRevenue * 0.65;
const previousMaintenance = (previousDoctorGross + previousNurseGross) * 0.05;
const previousProviderEarnings = previousDoctorGross + previousNurseGross - previousMaintenance;
const previousPlatformShare = previousDoctorRevenue * 0.3 + previousNurseRevenue * 0.35;
const cumulativeProviderEarnings = previousProviderEarnings + weeklyProviderEarnings;
const cumulativePlatformShare = previousPlatformShare + weeklyPlatformShare;
const cumulativeMaintenance = previousMaintenance + weeklyMaintenance;

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
      <Metric label="Users" value={200} icon={Users} />
      <Metric label="Doctors" value={24} icon={Stethoscope} tone="cyan" />
      <Metric label="Nurses" value={16} icon={Home} tone="green" />
      <Metric label="Platform revenue" value={formatMoney(totalRevenue)} icon={Banknote} tone="green" />
      <Metric label="Active consultations" value={12} icon={CalendarClock} />
      <Metric label="Active homecare" value={8} icon={ClipboardList} tone="cyan" />
      <Metric label="Provider earnings" value={formatMoney(cumulativeProviderEarnings)} icon={Activity} tone="amber" />
      <Metric label="Audit events" value={auditEvents.length} icon={ShieldCheck} tone="cyan" />
    </div>

    <Panel title="This week's revenue">
      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-[18px] border border-cyan-100 bg-cyan-50/50 p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-[#1F2937]">Doctor consultations</p><p className="mt-1 text-xs text-slate-500">{doctorConsultationCount} consultations × {formatMoney(doctorConsultationPrice)}</p></div><Badge tone="cyan">10 completed</Badge></div>
          <p className="mt-4 font-heading text-2xl font-semibold text-[#1F2937]">{formatMoney(doctorRevenue)}</p>
        </article>
        <article className="rounded-[18px] border border-emerald-100 bg-emerald-50/50 p-4">
          <div className="flex items-center justify-between gap-3"><div><p className="text-sm font-bold text-[#1F2937]">Home-care visits</p><p className="mt-1 text-xs text-slate-500">{homeCareVisitPrices.map((price) => formatMoney(price)).join(" + ")}</p></div><Badge tone="green">3 completed</Badge></div>
          <p className="mt-4 font-heading text-2xl font-semibold text-[#1F2937]">{formatMoney(nurseRevenue)}</p>
        </article>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[18px] bg-slate-100 px-4 py-4"><p className="text-xs font-semibold text-slate-500">Previous revenue</p><strong className="mt-1 block font-heading text-xl text-[#1F2937]">{formatMoney(previousRevenue)}</strong></div>
        <div className="rounded-[18px] bg-blue-50 px-4 py-4"><p className="text-xs font-semibold text-[#2563EB]">This week&apos;s addition</p><strong className="mt-1 block font-heading text-xl text-[#1F2937]">{formatMoney(weeklyRevenue)}</strong></div>
        <div className="rounded-[18px] bg-[#1F2937] px-4 py-4 text-white"><p className="text-xs font-semibold text-slate-300">Cumulative revenue</p><strong className="mt-1 block font-heading text-xl">{formatMoney(totalRevenue)}</strong></div>
      </div>
    </Panel>

    <div className="grid gap-4 xl:grid-cols-2">
      <Panel title="User management">
        <div className="mb-3 flex flex-wrap gap-2"><label className="text-sm font-semibold text-slate-500">Role <select aria-label="Filter users by role" value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }} className="ml-2 min-h-10 rounded-[12px] border border-slate-200 bg-white px-3 text-slate-700">{["All roles", "Patient", "Doctor", "Nurse"].map((role) => <option key={role}>{role}</option>)}</select></label><input aria-label="Search accounts" placeholder="Search email" value={search} onChange={(event) => { setSearch(event.target.value.toLowerCase()); setPage(1); }} className="min-h-10 rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-slate-700" /></div>
        <div className="grid gap-3">{pagedUsers.map((item) => <article key={item.email} className="rounded-[20px] border border-slate-200 bg-slate-50 p-4"><p className="break-all text-sm font-bold text-[#1F2937]">{item.email}</p><div className="mt-2 flex gap-2"><Badge tone="blue">{item.role}</Badge><Badge tone={item.status === "Pending" ? "amber" : "green"}>{item.status}</Badge></div></article>)}</div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-slate-500"><span>{visibleUsers.length} of 200 users · Page {page} of {pageCount}</span><div className="flex gap-2"><button type="button" disabled={page === 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous</button><button type="button" disabled={page === pageCount} onClick={() => setPage(page + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button></div></div>
      </Panel>
      <Panel title="Financial management">
        <div className="grid gap-3 sm:grid-cols-2"><Metric label="Cumulative provider earnings" value={formatMoney(cumulativeProviderEarnings)} icon={Activity} tone="amber" /><Metric label="Cumulative platform share" value={formatMoney(cumulativePlatformShare)} icon={Banknote} tone="green" /></div>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <p className="flex justify-between gap-3"><span>Doctor consultations</span><strong>{formatMoney(doctorRevenue)}</strong></p>
          <p className="flex justify-between gap-3"><span>Home-care visits</span><strong>{formatMoney(nurseRevenue)}</strong></p>
          <p className="flex justify-between gap-3"><span>Previous provider earnings</span><strong>{formatMoney(previousProviderEarnings)}</strong></p>
          <p className="flex justify-between gap-3"><span>This week&apos;s provider earnings</span><strong>{formatMoney(weeklyProviderEarnings)}</strong></p>
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
