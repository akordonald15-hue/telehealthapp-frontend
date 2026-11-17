"use client";

import {
  ArrowRight,
  Bell,
  ChevronDown,
  CircleHelp,
  Gift,
  HeartHandshake,
  LayoutGrid,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  ShieldPlus,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { buttonClassName } from "@/components/ds";
import { BRAND_SUPPORT_EMAIL } from "@/lib/brand";
import type { User } from "@/lib/types/backend";
import { cn } from "@/lib/utils";

// Patient sidebar and top bar from the Figma "Dashboard- filled" screen (FINAL DESIGN page).
// Desktop only (lg+); phones keep the app shell's top bar and bottom navigation.

type IconType = React.ComponentType<{ className?: string }>;

const myCareLinks = [
  { href: "/appointments", label: "Appointments" },
  { href: "/home-care/requests", label: "Home care requests" },
  { href: "/care-plan", label: "Care plan" },
  { href: "/records", label: "Medical records" },
  { href: "/referrals", label: "Referrals" },
  { href: "/payments", label: "Billing history" },
] as const;

const pageTitles: Array<[string, string]> = [
  ["/dashboard", "Dashboard"],
  ["/messages", "Messages"],
  ["/refer", "Refer and Earn"],
  ["/profile", "Profile and Settings"],
  ["/home-care/book", "Find Care"],
  ...myCareLinks.map((item) => [item.href, item.label] as [string, string]),
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function patientPageTitle(pathname: string) {
  return pageTitles.find(([href]) => isActive(pathname, href))?.[1] ?? "Dashboard";
}

function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2) ?? "C").toUpperCase();
}

const itemStyles =
  "flex min-h-[52px] w-full items-center gap-2 rounded-[12px] px-3.5 font-inter-tight text-base font-medium leading-5 text-black-500 transition hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus";

function NavItem({ href, label, icon: Icon, active, count }: { href: string; label: string; icon: IconType; active: boolean; count?: number }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={cn(itemStyles, active && "bg-primary-50 text-primary-500")}>
      <Icon className="size-6 shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {count ? (
        <span className="rounded-full bg-primary-50 px-1 text-primary-500" aria-label={`${count} unread`}>
          {count}
        </span>
      ) : null}
    </Link>
  );
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <p className="type-nav-item uppercase text-grey-500">{title}</p>
      <div className="grid">{children}</div>
    </div>
  );
}

export function PatientSidebar({ user, unreadCount, location }: { user: User; unreadCount: number; location?: string }) {
  const pathname = usePathname();
  const inMyCare = myCareLinks.some((item) => isActive(pathname, item.href));
  const [myCareOpen, setMyCareOpen] = useState(inMyCare);

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 hidden h-[100dvh] w-[266px] shrink-0 flex-col overflow-y-auto border-r border-grey-200 bg-white lg:flex"
    >
      <div className="px-6 pb-6 pt-[34px]">
        <BrandLockup wordmark="image" wordmarkClassName="h-8 max-w-[128px]" />
      </div>

      <div className="grid gap-6 px-4">
        <NavGroup title="Main menu">
          <NavItem href="/dashboard" label="Dashboard" icon={LayoutGrid} active={isActive(pathname, "/dashboard")} />
          <NavItem href="/home-care/book" label="Find Care" icon={ShieldPlus} active={isActive(pathname, "/home-care/book")} />
          <div>
            <button
              type="button"
              aria-expanded={myCareOpen}
              aria-controls="my-care-links"
              onClick={() => setMyCareOpen((open) => !open)}
              className={cn(itemStyles, inMyCare && !myCareOpen && "bg-primary-50 text-primary-500")}
            >
              <HeartHandshake className="size-6 shrink-0" />
              <span className="flex-1 truncate text-left">My Care</span>
              <ChevronDown className={cn("size-6 shrink-0 transition-transform", myCareOpen && "rotate-180")} />
            </button>
            {myCareOpen ? (
              <div id="my-care-links" className="grid gap-0.5 pb-1 pl-8">
                {myCareLinks.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 items-center rounded-[12px] px-3.5 font-inter-tight text-sm font-medium leading-4 text-grey-600 transition hover:bg-primary-50 hover:text-black-500 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus",
                        active && "bg-primary-50 text-primary-500",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
          <NavItem href="/messages" label="Messages" icon={MessageSquareText} active={isActive(pathname, "/messages")} count={unreadCount} />
          <NavItem href="/refer" label="Refer and Earn" icon={Gift} active={isActive(pathname, "/refer")} />
        </NavGroup>

        <NavGroup title="Support">
          {/* There is no help page yet; support is by email. */}
          <a href={`mailto:${BRAND_SUPPORT_EMAIL}`} className={itemStyles}>
            <CircleHelp className="size-6 shrink-0" />
            <span className="flex-1 truncate">Help and Support</span>
          </a>
        </NavGroup>

        <NavGroup title="Account">
          <NavItem href="/profile" label="Profile and Settings" icon={Settings} active={isActive(pathname, "/profile")} />
        </NavGroup>
      </div>

      <div className="mt-auto grid gap-4 px-4 pb-4 pt-8">
        <div className="grid gap-5 rounded-[20px] border border-grey-200 bg-grey-50 p-4">
          <div className="grid gap-3">
            <p className="flex items-center gap-2 font-inter-tight text-base font-medium leading-5 text-black-500">
              <ShieldCheck className="size-6 shrink-0" />
              Verified care only
            </p>
            <p className="font-inter-tight text-[13px] font-medium leading-4 text-grey-500">
              Every doctor and nurse on Caretekk is credential-checked.
            </p>
          </div>
          <Link href="/#trust" className={buttonClassName({ variant: "ghost", size: "md", className: "justify-start px-0 hover:bg-transparent hover:underline" })}>
            How we verify
            <ArrowRight />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t border-grey-200 p-4">
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar URLs come from the API's storage host
          <img src={user.avatar_url} alt="" className="size-[50px] shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-primary-100 font-manrope text-base font-bold text-primary-600" aria-hidden="true">
            {initials(user.full_name)}
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate font-inter-tight text-sm font-medium leading-4 text-black-500">{user.full_name || "Caretekk patient"}</span>
          {location ? <span className="block truncate font-inter-tight text-xs font-medium leading-4 text-grey-500">{location}</span> : null}
        </span>
      </div>
    </nav>
  );
}

export function PatientTopBar({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 hidden min-h-[92px] items-center justify-between gap-6 border-b border-grey-200 bg-white px-10 lg:flex">
      <h1 className="type-heading-3 truncate text-black-500">{patientPageTitle(pathname)}</h1>
      <div className="flex items-center gap-4">
        {/* No search page exists yet: this opens doctor booking, where patients choose a doctor. */}
        <Link
          href="/appointments"
          className="flex min-h-[52px] w-[350px] items-center gap-3 rounded-[8px] border-[1.5px] border-grey-200 bg-grey-50 px-3 font-manrope text-sm leading-4 text-grey-400 transition hover:border-grey-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
        >
          <Search className="size-6 shrink-0 text-grey-500" />
          Search doctors and nurses...
        </Link>
        <Link
          href="/messages"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
          className="relative flex size-[52px] items-center justify-center rounded-[8px] bg-primary-50 text-black-500 transition hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
        >
          <Bell className="size-6" />
          {unreadCount ? <span className="absolute right-3 top-3 size-2.5 rounded-full bg-danger-500 ring-2 ring-primary-50" /> : null}
        </Link>
      </div>
    </header>
  );
}
