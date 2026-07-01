"use client";

import {
  Bell,
  CalendarDays,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UserRoundCheck,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { OfflineStatusBanner } from "@/components/pwa/offline-status-banner";
import { ProviderHeartbeat } from "@/components/providers/provider-heartbeat";
import { Badge } from "@/components/ui/badge";
import { messagingApi } from "@/lib/api/endpoints";
import { useCurrentUser } from "@/lib/auth/use-auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  patientLabel?: string;
  doctorLabel?: string;
  adminLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: readonly string[];
};

const navItems: readonly NavItem[] = [
  { href: "/dashboard", label: "Dashboard", patientLabel: "Your Care Journey", icon: LayoutDashboard, roles: ["patient", "doctor", "admin", "nurse"] },
  { href: "/messages", label: "Messages", patientLabel: "Messages", adminLabel: "Communications", icon: MessageSquare, roles: ["patient", "doctor", "admin"] },
  { href: "/care-plan", label: "Care Plan", patientLabel: "Care Plan", icon: ClipboardList, roles: ["patient"] },
  { href: "/home-care/book", label: "Home Care", patientLabel: "Home Care", icon: Home, roles: ["patient"] },
  { href: "/appointments", label: "Appointments", doctorLabel: "Consultations", adminLabel: "Bookings", icon: CalendarDays, roles: ["patient", "doctor", "admin"] },
  { href: "/nurse/requests", label: "Requests", icon: ClipboardList, roles: ["nurse"] },
  { href: "/nurse/history", label: "History", icon: FileText, roles: ["nurse"] },
  { href: "/records", label: "Records", doctorLabel: "Patients / Care Plans", adminLabel: "Users / Records", icon: UserRoundCheck, roles: ["patient", "doctor", "admin"] },
  { href: "/referrals", label: "Referrals", patientLabel: "Referrals", icon: ClipboardList, roles: ["patient", "admin"] },
  { href: "/profile", label: "Profile", icon: UserRound, roles: ["patient", "doctor", "admin", "nurse"] },
  { href: "/audit", label: "Audit", icon: ShieldCheck, roles: ["admin"] },
] as const;

const patientBottomNav = [
  { href: "/dashboard", label: "Home", icon: Home, primary: false },
  { href: "/messages", label: "Messages", icon: MessageSquare, primary: false },
  { href: "/appointments", label: "Book Doctor", icon: Stethoscope, primary: true },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, primary: false },
  { href: "/profile", label: "Profile", icon: UserRound, primary: false },
] as const;

function roleTone(role: string | undefined) {
  if (role === "admin") return "rose" as const;
  if (role === "doctor") return "cyan" as const;
  if (role === "nurse") return "blue" as const;
  return "blue" as const;
}

function navLabelForRole(item: NavItem, role: string | undefined) {
  if (role === "patient") {
    return item.patientLabel ?? item.label;
  }
  if (role === "doctor") {
    return item.doctorLabel ?? item.label;
  }
  if (role === "admin") {
    return item.adminLabel ?? item.label;
  }
  return item.label;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userQuery = useCurrentUser();
  const user = userQuery.data;
  const notificationQuery = useQuery({
    queryKey: ["threads", "shell-notifications"],
    queryFn: () => messagingApi.threads({ page_size: 20 }),
    enabled: user?.role === "patient",
    staleTime: 30000,
  });

  const visibleNav = useMemo(() => {
    const filtered = navItems.filter((item) => !user || (item.roles as readonly string[]).includes(user.role));
    if (user?.role === "doctor") {
      const doctorOrder = ["/dashboard", "/appointments", "/messages", "/records", "/profile"];
      return [...filtered].sort((left, right) => doctorOrder.indexOf(left.href) - doctorOrder.indexOf(right.href));
    }

    if (user?.role === "admin") {
      const adminOrder = ["/dashboard", "/appointments", "/messages", "/referrals", "/records", "/audit", "/profile"];
      return [...filtered].sort((left, right) => adminOrder.indexOf(left.href) - adminOrder.indexOf(right.href));
    }

    if (user?.role !== "patient") {
      return filtered;
    }

    const patientOrder = [
      "/dashboard",
      "/messages",
      "/care-plan",
      "/referrals",
      "/home-care/book",
      "/appointments",
      "/records",
      "/profile",
    ];
    return [...filtered].sort((left, right) => patientOrder.indexOf(left.href) - patientOrder.indexOf(right.href));
  }, [user]);

  const activeItem = visibleNav.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  const activeLabel = activeItem ? navLabelForRole(activeItem, user?.role) : user?.role === "patient" ? "Journey" : "Workspace";

  const bottomNav = user?.role === "patient" ? patientBottomNav : visibleNav.map((item) => ({ ...item, primary: false }));
  const unreadCount = notificationQuery.data?.results.reduce((sum, thread) => sum + (thread.unread_count ?? 0), 0) ?? 0;

  return (
    <div className="ct-safe-area min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_rgba(124,164,215,0.15),_transparent_28%),linear-gradient(180deg,#F5F8FC_0%,#F7FAFE_40%,#FFFFFF_100%)]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1600px]">
        <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/65 bg-white/82 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <div className="min-w-0">
                  <BrandLockup wordmark="image" wordmarkClassName="h-5 max-w-[132px] sm:h-6 sm:max-w-[150px]" />
                  {user?.role !== "patient" ? (
                    <h1 className="mt-1 truncate font-heading text-lg font-semibold tracking-[-0.025em] text-[#1F2937] sm:text-xl">{activeLabel}</h1>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold text-[#1F2937]">{user?.full_name || "Caretekk user"}</p>
                  <p className="text-xs text-slate-500">{user?.email || "Signed in securely"}</p>
                </div>
                {user?.role === "patient" ? (
                  <Link
                    href="/messages"
                    aria-label="Open notifications"
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1F2937] shadow-[0_14px_34px_-28px_rgba(15,23,42,0.7)] ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:text-[#2563EB]"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 ? (
                      <span className="ct-pop-in absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[10px] font-bold leading-none text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    ) : null}
                  </Link>
                ) : user ? (
                  <Badge tone={roleTone(user.role)}>{user.full_name?.[0] || "C"}</Badge>
                ) : null}
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 scroll-pb-44 px-4 py-5 pb-[calc(11rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 lg:px-8">
            <ProviderHeartbeat />
            <OfflineStatusBanner />
            {children}
          </main>

          {user ? (
            <nav
              className={cn(
                "fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/98 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-18px_54px_-42px_rgba(15,23,42,0.5)] backdrop-blur",
                user.role === "patient" ? "grid grid-cols-[1fr_1fr_1.25fr_1fr_1fr] items-end" : "flex gap-2 overflow-x-auto",
              )}
              aria-label="Bottom navigation"
            >
              {bottomNav.map((item) => {
                const Icon = item.icon;
                const active = !item.primary && (pathname === item.href || pathname.startsWith(`${item.href}/`));
                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    className={cn(
                      "flex min-w-0 flex-col items-center gap-1 rounded-[8px] px-1 py-2 text-[11px] font-semibold text-slate-500 transition-all duration-200 active:scale-[0.97]",
                      user.role !== "patient" && "min-w-[92px]",
                      active && "text-[#2563EB]",
                      item.primary && "-mt-5 text-[#2563EB]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-[8px] bg-slate-50 transition-all duration-200",
                        active && "scale-105 bg-[#DBEAFE]",
                        item.primary && "h-[52px] w-[52px] rounded-full bg-white text-[#2563EB] shadow-[0_18px_38px_-22px_rgba(37,99,235,0.45)] ring-2 ring-[#DBEAFE]",
                      )}
                    >
                      <Icon className={item.primary ? "h-6 w-6" : "h-5 w-5"} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
