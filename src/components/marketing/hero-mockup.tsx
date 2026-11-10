import {
  ArrowRight,
  BatteryMedium,
  Bell,
  CalendarClock,
  ChevronRight,
  ClipboardList,
  FileText,
  Home,
  MessageSquareText,
  Signal,
  Stethoscope,
  User,
  Wifi,
} from "lucide-react";

import { BRAND_NAME } from "@/lib/brand";

export function HeroMockup() {
  return (
    <div className="relative flex justify-center md:justify-end">
      <div className="relative">
        {/* Floating chips — all on the left so they never clip the right-aligned phone */}
        <FloatingChip className="right-full top-10 mr-4" dot="emerald">
          Dr. Effiong replied
        </FloatingChip>
        <FloatingChip
          className="right-full top-1/2 mr-4 -translate-y-1/2"
          icon={<FileText className="h-3.5 w-3.5 text-primary-500" />}
        >
          New care plan ready
        </FloatingChip>
        <FloatingChip
          className="right-full bottom-12 mr-4"
          icon={<Home className="h-3.5 w-3.5 text-primary-500" />}
        >
          Home visits in Akwa Ibom State, Nigeria
        </FloatingChip>

        {/* Live preview pulse badge */}
        <div
          className="absolute -top-3 right-4 z-20 flex items-center gap-1.5 rounded-full bg-primary-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg md:right-6"
          aria-hidden
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          Live preview
        </div>

        {/* Phone bezel */}
        <div className="relative h-[620px] w-72 rounded-[46px] border border-grey-900 bg-linear-to-b from-grey-800 via-grey-900 to-grey-800 p-2.5 shadow-2xl shadow-grey-900/30">
          <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-grey-50">
            {/* Dynamic island */}
            <div className="absolute left-1/2 top-3 z-40 h-7 w-28 -translate-x-1/2 rounded-full bg-black ring-1 ring-white/10" />

            {/* Screen */}
            <div className="flex h-full w-full flex-col text-grey-800">
              {/* Status bar */}
              <div className="flex items-center justify-between px-6 pb-1 pt-2.5 text-[10px] font-semibold">
                <span>11:02</span>
                <div className="flex items-center gap-1">
                  <Signal className="h-2.5 w-2.5" />
                  <Wifi className="h-2.5 w-2.5" />
                  <BatteryMedium className="h-3 w-3" />
                </div>
              </div>

              {/* App top bar */}
              <div className="flex items-center justify-between px-4 pt-3">
                <span className="font-heading text-[13px] font-bold tracking-tight text-grey-800">
                  {BRAND_NAME}
                </span>
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full border border-grey-200 bg-white text-grey-500">
                  <Bell className="h-3.5 w-3.5" />
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-danger-500 ring-2 ring-white" />
                </span>
              </div>

              {/* Body — scroll area */}
              <div className="flex-1 overflow-hidden px-4 pt-3">
                {/* Verified chip */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-grey-200 bg-white px-2 py-0.5 text-[9px] font-medium text-grey-500">
                  <span className="h-1 w-1 rounded-full bg-success-500" />
                  Verified care account
                </div>

                {/* Greeting */}
                <p className="mt-2 text-[10px] text-grey-500">Good morning</p>
                <h2 className="-mt-0.5 font-heading text-base font-bold tracking-tight text-grey-800">
                  Your Care Journey
                </h2>

                {/* Hero gradient card — mirrors the real dashboard */}
                <div className="mt-2.5 rounded-2xl bg-[linear-gradient(135deg,#3961A9_0%,#6181BA_45%,#6181BA_100%)] p-3 text-white shadow-[0_10px_28px_-12px_rgba(57,97,169,0.45)]">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-primary-100">
                    Guided Journey
                  </p>
                  <p className="mt-1 text-[11px] font-semibold leading-snug">
                    Start with a quick care check-in.
                  </p>
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[9px] font-bold text-primary-500 shadow-sm"
                  >
                    Start Care Check-in
                    <ArrowRight className="h-2.5 w-2.5" />
                  </button>
                </div>

                {/* Status row — 3 tiles */}
                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <StatusTile
                    label="Check-in"
                    value="Done"
                    accent="emerald"
                    icon={<ClipboardList className="h-3 w-3" />}
                  />
                  <StatusTile
                    label="Consult"
                    value="Ready"
                    accent="blue"
                    icon={<MessageSquareText className="h-3 w-3" />}
                  />
                  <StatusTile
                    label="Care plan"
                    value="Updated"
                    accent="violet"
                    icon={<FileText className="h-3 w-3" />}
                  />
                </div>

                {/* Active consultation preview */}
                <p className="mt-3 text-[10px] font-semibold text-grey-700">
                  Active consultation
                </p>
                <div className="mt-1.5 rounded-2xl border border-grey-200 bg-white p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-primary-500 to-primary-400 text-[10px] font-bold text-white">
                      EO
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-[10px] font-bold text-grey-800">
                          Dr. Effiong Okon
                        </p>
                        <span className="rounded-full bg-success-100 px-1.5 py-px text-[7px] font-semibold uppercase tracking-wide text-success-700">
                          Online
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[9px] text-grey-500">
                        Take the prescription with food.
                      </p>
                    </div>
                    <ChevronRight className="h-3 w-3 text-grey-400" />
                  </div>
                </div>

                {/* Quick actions */}
                <p className="mt-3 text-[10px] font-semibold text-grey-700">
                  Continue care
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                  <QuickAction
                    icon={<Home className="h-3.5 w-3.5" />}
                    title="Book home care"
                    subtitle="Nurse to your door"
                  />
                  <QuickAction
                    icon={<CalendarClock className="h-3.5 w-3.5" />}
                    title="Book a visit"
                    subtitle="See a doctor"
                  />
                </div>

                {/* Upcoming visit */}
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-grey-700">
                    Upcoming visit
                  </span>
                  <span className="flex items-center gap-0.5 text-[9px] font-medium text-primary-500">
                    See all <ChevronRight className="h-2.5 w-2.5" />
                  </span>
                </div>
                <div className="mt-1 rounded-xl border border-grey-200 bg-white p-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-500">
                      <Stethoscope className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold text-grey-800">
                        General consult · Today, 2:00 PM
                      </p>
                      <p className="text-[9px] text-grey-500">Dr. Idam Michael</p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full bg-primary-500 px-2 py-0.5 text-[8px] font-bold text-white"
                    >
                      Join
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom tab bar */}
              <div className="relative border-t border-grey-200 bg-white pb-3 pt-2">
                <div className="grid grid-cols-5 items-end px-3 text-[8.5px]">
                  <TabItem icon={<Home className="h-3.5 w-3.5" />} label="Home" active />
                  <TabItem icon={<CalendarClock className="h-3.5 w-3.5" />} label="Visits" />
                  <TabItem icon={<MessageSquareText className="h-3.5 w-3.5" />} label="Messages" />
                  <TabItem icon={<FileText className="h-3.5 w-3.5" />} label="Care plan" />
                  <TabItem icon={<User className="h-3.5 w-3.5" />} label="Me" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FloatingChip({
  className = "",
  children,
  icon,
  dot,
}: {
  className?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dot?: "emerald" | "blue";
}) {
  return (
    <div
      className={`absolute z-10 hidden items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(116,118,134,0.18)] bg-white px-3 py-1.5 text-xs font-medium text-grey-800 shadow-lg md:inline-flex ${className}`}
    >
      {dot ? (
        <span className={`h-2 w-2 rounded-full ${dot === "emerald" ? "bg-success-500" : "bg-primary-400"}`} />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </div>
  );
}

function StatusTile({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: "blue" | "emerald" | "violet";
}) {
  const accents = {
    blue: { bg: "bg-primary-50", ring: "ring-primary-100", text: "text-primary-500" },
    emerald: { bg: "bg-success-50", ring: "ring-success-100", text: "text-success-600" },
    violet: { bg: "bg-violet-50", ring: "ring-violet-100", text: "text-violet-600" },
  }[accent];

  return (
    <div className={`rounded-xl border border-grey-200 bg-white p-2`}>
      <span className={`flex h-5 w-5 items-center justify-center rounded-md ${accents.bg} ${accents.text} ring-1 ring-inset ${accents.ring}`}>
        {icon}
      </span>
      <p className="mt-1 text-[8.5px] text-grey-500">{label}</p>
      <p className="text-[10px] font-bold text-grey-800">{value}</p>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="rounded-xl border border-grey-200 bg-white p-2.5">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 text-primary-500">
        {icon}
      </span>
      <p className="mt-1.5 text-[10px] font-bold text-grey-800">{title}</p>
      <p className="text-[9px] text-grey-500">{subtitle}</p>
    </div>
  );
}

function TabItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 ${active ? "text-primary-500" : "text-grey-400"}`}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
