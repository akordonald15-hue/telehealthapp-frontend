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
  MessageSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser, useLogout } from "@/lib/auth/use-auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["patient", "doctor", "admin"] },
  { href: "/appointments", label: "Appointments", icon: CalendarDays, roles: ["patient", "doctor", "admin"] },
  { href: "/messages", label: "Messages", icon: MessageSquare, roles: ["patient", "doctor", "admin"] },
  { href: "/records", label: "Records", icon: FileText, roles: ["patient", "doctor", "admin"] },
  { href: "/payments", label: "Payments", icon: CreditCard, roles: ["patient", "admin"] },
  { href: "/referrals", label: "Referrals", icon: ClipboardList, roles: ["patient", "doctor", "admin"] },
  { href: "/triage", label: "AI Triage", icon: HeartPulse, roles: ["patient", "doctor", "admin"] },
  { href: "/profile", label: "Profile", icon: UserRound, roles: ["patient", "doctor", "admin"] },
  { href: "/audit", label: "Audit", icon: ShieldCheck, roles: ["admin"] },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const userQuery = useCurrentUser();
  const logout = useLogout();
  const user = userQuery.data;

  const visibleNav = navItems.filter((item) => !user || (item.roles as readonly string[]).includes(user.role));

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white lg:block">
        <div className="flex h-full flex-col">
          <div className="border-b border-zinc-200 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#2563EB] text-white">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-zinc-950">LifeFirst</p>
                <p className="text-xs text-zinc-500">Care workspace</p>
              </div>
            </div>
          </div>
          <nav className="grid gap-1 p-3">
            {visibleNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100",
                    active && "bg-[#EFF6FF] text-[#2563EB]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-zinc-200 p-4">
            {user ? (
              <div className="mb-3">
                <p className="truncate text-sm font-semibold text-zinc-950">{user.email}</p>
                <div className="mt-2">
                  <Badge tone={user.role === "admin" ? "rose" : user.role === "doctor" ? "cyan" : "green"}>
                    {user.role}
                  </Badge>
                </div>
              </div>
            ) : null}
            <Button className="w-full" variant="secondary" onClick={() => logout.mutate()} disabled={logout.isPending}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <Link href="/dashboard" className="font-semibold text-zinc-950 lg:hidden">
              LifeFirst
            </Link>
            <div className="hidden text-sm text-zinc-600 lg:block">Backend-aligned care portal</div>
            {user ? <Badge>{user.role}</Badge> : null}
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-8">{children}</main>
      </div>
    </div>
  );
}
