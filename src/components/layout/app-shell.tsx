"use client";

import {
  CalendarDays,
  ClipboardList,
  FileText,
  HeartPulse,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser, useLogout } from "@/lib/auth/use-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  patientLabel?: string;
  doctorLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly string[];
};

const navItems: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", patientLabel: "Journey", icon: LayoutDashboard, roles: ["patient", "doctor", "admin", "nurse"] },
  { href: "/triage", label: "Care check-in", patientLabel: "Start Triage", icon: HeartPulse, roles: ["patient", "admin"] },
  { href: "/messages", label: "Messages", patientLabel: "Consultation", icon: MessageSquare, roles: ["patient", "doctor", "admin"] },
  { href: "/care-plan", label: "Care Plan", patientLabel: "Care Plan", icon: ClipboardList, roles: ["patient"] },
  { href: "/home-care/book", label: "Book Nurse", patientLabel: "Book Nurse", icon: Home, roles: ["patient"] },
  { href: "/home-care/requests", label: "Home Care", patientLabel: "Home Care", icon: ClipboardList, roles: ["patient"] },
  { href: "/appointments", label: "Appointments", doctorLabel: "Consultations", icon: CalendarDays, roles: ["patient", "doctor", "admin"] },
  { href: "/nurse/requests", label: "Requests", icon: ClipboardList, roles: ["nurse"] },
  { href: "/nurse/history", label: "History", icon: FileText, roles: ["nurse"] },
  { href: "/records", label: "Records", doctorLabel: "Patients / Care Plans", icon: UserRoundCheck, roles: ["patient", "doctor", "admin"] },
  { href: "/referrals", label: "Referrals", icon: ClipboardList, roles: ["doctor", "admin"] },
  { href: "/profile", label: "Profile", icon: UserRound, roles: ["patient", "doctor", "admin", "nurse"] },
  { href: "/audit", label: "Audit", icon: ShieldCheck, roles: ["admin"] },
] as const;

function roleTone(role: string | undefined) {
  if (role === "admin") return "rose" as const;
  if (role === "doctor") return "cyan" as const;
  if (role === "nurse") return "blue" as const;
  return "green" as const;
}

function navLabelForRole(item: NavItem, role: string | undefined) {
  if (role === "patient") {
    return item.patientLabel ?? item.label;
  }
  if (role === "doctor") {
    return item.doctorLabel ?? item.label;
  }
  return item.label;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userQuery = useCurrentUser();
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = userQuery.data;

  const visibleNav = useMemo(() => {
    const filtered = navItems.filter((item) => !user || (item.roles as readonly string[]).includes(user.role));
    if (user?.role === "doctor") {
      const doctorOrder = ["/dashboard", "/appointments", "/messages", "/referrals", "/records", "/profile"];
      return [...filtered].sort((left, right) => doctorOrder.indexOf(left.href) - doctorOrder.indexOf(right.href));
    }

    if (user?.role !== "patient") {
      return filtered;
    }

    const patientOrder = [
      "/dashboard",
      "/triage",
      "/messages",
      "/care-plan",
      "/home-care/book",
      "/home-care/requests",
      "/appointments",
      "/records",
      "/profile",
    ];
    return [...filtered].sort((left, right) => patientOrder.indexOf(left.href) - patientOrder.indexOf(right.href));
  }, [user]);

  const activeItem = visibleNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const activeLabel = activeItem ? navLabelForRole(activeItem, user?.role) : user?.role === "patient" ? "Journey" : "Workspace";

  const workspaceTitle =
    user?.role === "nurse"
      ? "Your home care workspace"
      : user?.role === "doctor"
        ? "Doctor clinical workspace"
        : "Everything you need for your care journey";
  const workspaceDescription =
    user?.role === "nurse"
      ? "Requests, travel updates, visit progress, and history stay in one clean workflow."
      : user?.role === "doctor"
        ? "Consultations, patient messages, referrals, and care-plan notes stay focused on your clinical work."
        : "Appointments, messages, records, and care plans are organized here so you can move through your care with ease.";

  const navigation = (
    <>
      <div className="rounded-[24px] border border-white/70 bg-[linear-gradient(180deg,#FFFFFF_0%,#F8FBFF_100%)] p-4 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.55)]">
        <BrandLockup href="/" wordmark="image" wordmarkClassName="h-6 max-w-[150px]" />
        <div className="mt-4 rounded-[18px] border border-[rgba(66,107,179,0.1)] bg-[var(--primary-soft)] px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-[#1F2937]">{workspaceTitle}</p>
          <p className="mt-1 leading-6">{workspaceDescription}</p>
        </div>
      </div>

      <nav className="mt-5 grid gap-2">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "group flex items-center gap-3 rounded-[18px] border px-4 py-3 text-sm font-semibold transition",
                active
                  ? "border-[rgba(66,107,179,0.18)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[0_20px_40px_-34px_rgba(66,107,179,0.38)]"
                  : "border-transparent bg-white/75 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-[#1F2937] hover:shadow-[0_18px_34px_-34px_rgba(15,23,42,0.45)]",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-[14px] transition",
                  active ? "bg-white text-[var(--primary)]" : "bg-slate-100 text-slate-500 group-hover:bg-[var(--primary-soft)] group-hover:text-[var(--primary)]",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1">{navLabelForRole(item, user?.role)}</span>
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(112,152,212,0.16),_transparent_28%),linear-gradient(180deg,#F5F9FF_0%,#F7FAFE_38%,#FFFFFF_100%)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <aside className="hidden w-[290px] shrink-0 px-5 py-6 lg:block xl:px-6">
          <div className="sticky top-6">{navigation}</div>
        </aside>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 bg-slate-950/38 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)}>
            <aside
              className="absolute inset-y-0 left-0 w-[86vw] max-w-sm overflow-y-auto border-r border-white/60 bg-[#F5F9FF] px-4 py-5 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <BrandLockup href="/" wordmark="image" wordmarkClassName="h-6 max-w-[150px]" />
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
                  <BrandLockup href="/" wordmark="image" wordmarkClassName="h-5 max-w-[132px] sm:h-6 sm:max-w-[150px]" />
                  <h1 className="mt-1 truncate font-heading text-lg font-semibold text-[#1F2937] sm:text-xl">{activeLabel}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-[#1F2937]">
                    {user?.role === "nurse"
                      ? "Care visits, all in one place"
                      : user?.role === "doctor"
                        ? "Patient care, all in one place"
                        : "Your care, all in one place"}
                  </p>
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
