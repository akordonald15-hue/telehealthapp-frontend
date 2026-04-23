"use client";

import {
  Activity,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/lib/auth/use-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  patientLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly string[];
};

const navItems: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", patientLabel: "Journey", icon: LayoutDashboard, roles: ["patient", "doctor", "admin"] },
  { href: "/triage", label: "Care check-in", patientLabel: "Start Triage", icon: HeartPulse, roles: ["patient", "doctor", "admin"] },
  { href: "/messages", label: "Messages", patientLabel: "Consultation", icon: MessageSquare, roles: ["patient", "doctor", "admin"] },
  { href: "/care-plan", label: "Care Plan", patientLabel: "Care Plan", icon: ClipboardList, roles: ["patient"] },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, roles: ["patient", "doctor", "admin"] },
  { href: "/records", label: "Records", icon: FileText, roles: ["patient", "doctor", "admin"] },
  { href: "/payments", label: "Payments", icon: CreditCard, roles: ["patient", "admin"] },
  { href: "/referrals", label: "Referrals", icon: ClipboardList, roles: ["doctor", "admin"] },
  { href: "/profile", label: "Profile", icon: UserRound, roles: ["patient", "doctor", "admin"] },
  { href: "/audit", label: "Audit", icon: ShieldCheck, roles: ["admin"] },
] as const;

function roleTone(role: string | undefined) {
  if (role === "admin") return "rose" as const;
  if (role === "doctor") return "cyan" as const;
  return "green" as const;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userQuery = useCurrentUser();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = userQuery.data;

  const visibleNav = useMemo(() => {
    const filtered = navItems.filter((item) => !user || (item.roles as readonly string[]).includes(user.role));
    if (user?.role !== "patient") {
      return filtered;
    }

    const patientOrder = ["/dashboard", "/triage", "/messages", "/care-plan", "/appointments", "/records", "/payments", "/profile"];
    return [...filtered].sort((left, right) => patientOrder.indexOf(left.href) - patientOrder.indexOf(right.href));
  }, [user]);

  const activeItem = visibleNav.find((item) => pathname === item.href);
  const activeLabel = user?.role === "patient" ? activeItem?.patientLabel ?? activeItem?.label ?? "Journey" : activeItem?.label ?? "Workspace";

  const navigation = (
    <>
      <div className="rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-4 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.55)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] text-white shadow-lg shadow-blue-200/70">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="font-heading text-base font-semibold text-[#1F2937]">LifeFirst</p>
            <p className="text-sm text-slate-500">Care workspace</p>
          </div>
        </div>
        <div className="mt-4 rounded-[18px] border border-blue-100 bg-[#EFF6FF] px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-[#1F2937]">Everything you need for your care journey</p>
          <p className="mt-1 leading-6">Appointments, messages, records, and payments are organized here so you can move through your care with ease.</p>
        </div>
      </div>

      <nav className="mt-5 grid gap-2">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm font-semibold transition",
                active
                  ? "border-blue-200 bg-[#EFF6FF] text-[#2563EB] shadow-[0_20px_40px_-34px_rgba(37,99,235,0.5)]"
                  : "border-transparent bg-white/75 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-[#1F2937] hover:shadow-[0_18px_34px_-34px_rgba(15,23,42,0.45)]",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-[14px] transition",
                  active ? "bg-white text-[#2563EB]" : "bg-slate-100 text-slate-500 group-hover:bg-[#DBEAFE] group-hover:text-[#2563EB]",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{user?.role === "patient" ? item.patientLabel ?? item.label : item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-5 rounded-[24px] border border-white/70 bg-white p-4 shadow-[0_22px_58px_-42px_rgba(15,23,42,0.5)]">
        {user ? (
          <div>
            <p className="truncate text-sm font-semibold text-[#1F2937]">{user.email}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone={roleTone(user.role)}>{user.role}</Badge>
              <span className="text-xs text-slate-500">Personalized for your account</span>
            </div>
          </div>
        ) : null}
        <Button
          className="mt-4 w-full"
          variant="secondary"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logout.isPending ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.14),_transparent_28%),linear-gradient(180deg,#F8FBFF_0%,#F9FAFB_38%,#FFFFFF_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-[290px] shrink-0 px-5 py-6 lg:block xl:px-6">
          <div className="sticky top-6">{navigation}</div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 bg-slate-950/38 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
            <aside
              className="absolute inset-y-0 left-0 w-[86vw] max-w-sm overflow-y-auto border-r border-white/60 bg-[#F8FBFF] px-4 py-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-heading text-lg font-semibold text-[#1F2937]">LifeFirst</p>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {navigation}
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/65 bg-white/82 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#2563EB]">LifeFirst</p>
                  <h1 className="truncate font-heading text-lg font-semibold text-[#1F2937] sm:text-xl">{activeLabel}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-[#1F2937]">Your care, all in one place</p>
                  <p className="text-xs text-slate-500">Responsive, clear, and tailored to your account</p>
                </div>
                {user ? <Badge tone={roleTone(user.role)}>{user.role}</Badge> : null}
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
