"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  FileText,
  Gift,
  HeartHandshake,
  MapPin,
  MessageSquareText,
  Video,
} from "lucide-react";
import Link from "next/link";

import { buttonClassName, Pill, type PillTone } from "@/components/ds";
import { Notice } from "@/components/ui/notice";
import { canRateAppointment, ConsultationReviewForm, ConsultationReviewSummary } from "@/features/appointments/consultation-review";
import { homeCareStatusLabel } from "@/features/homecare/homecare-utils";
import { appointmentsApi, homeCareApi, messagingApi, profilesApi } from "@/lib/api/endpoints";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { Appointment, AppointmentStatus, HomeCareRequestListItem, PatientProfile, Thread, User } from "@/lib/types/backend";
import { cn } from "@/lib/utils";

// Patient dashboard from the Figma "Dashboard- filled" screen (FINAL DESIGN page, light background version),
// built with the design system (src/components/ds + design-system classes).

// ---------- formatting ----------

function ordinal(day: number) {
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix}`;
}

/** "Nov. 17th, 2026" */
function longDate(value: Date) {
  const month = new Intl.DateTimeFormat("en", { month: "short" }).format(value);
  return `${month}. ${ordinal(value.getDate())}, ${value.getFullYear()}`;
}

/** "14th Nov, 2026" */
function shortDate(value: string) {
  const date = new Date(value);
  return `${ordinal(date.getDate())} ${new Intl.DateTimeFormat("en", { month: "short" }).format(date)}, ${date.getFullYear()}`;
}

function timeOfDay(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const startOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((startOf(date) - startOf(today)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return new Intl.DateTimeFormat("en", { weekday: "short", day: "numeric", month: "short" }).format(date);
}

/** "Yesterday, 6:30 PM" / "19th Nov, 2026, 8:00 AM" */
function activityTime(value: string) {
  const label = dayLabel(value);
  const day = ["Today", "Tomorrow", "Yesterday"].includes(label) ? label : shortDate(value);
  return `${day}, ${timeOfDay(value)}`;
}

function relativeTime(value: string) {
  const minutes = Math.round((new Date(value).getTime() - Date.now()) / 60_000);
  const format = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (Math.abs(minutes) < 60) return format.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return format.format(hours, "hour");
  return format.format(Math.round(hours / 24), "day");
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(value?: string | null) {
  return value?.trim().split(/\s+/)[0] || "there";
}

// ---------- status ----------

const finishedAppointment: AppointmentStatus[] = ["completed", "cancelled", "missed"];
const finishedHomeCare = ["care_completed", "patient_confirmed", "cancelled", "match_failed"];
const awaitingHomeCare = ["requested", "awaiting_payment", "awaiting_payment_verification", "matching", "assigned", "verification_in_progress", "awaiting_patient_confirmation"];

const appointmentStatus: Record<AppointmentStatus, { label: string; tone: PillTone }> = {
  pending_payment: { label: "Awaiting payment", tone: "warning" },
  awaiting_payment_verification: { label: "Payment being verified", tone: "warning" },
  payment_rejected: { label: "Payment not confirmed", tone: "danger" },
  confirmed: { label: "Confirmed", tone: "success" },
  scheduled: { label: "Scheduled", tone: "success" },
  accepted: { label: "Accepted", tone: "success" },
  in_progress: { label: "In progress", tone: "info" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
  missed: { label: "Missed", tone: "neutral" },
};

function homeCareTone(status: string): PillTone {
  if (finishedHomeCare.includes(status)) return status === "cancelled" || status === "match_failed" ? "danger" : "neutral";
  if (status === "payment_rejected" || status === "unreachable") return "danger";
  if (awaitingHomeCare.includes(status)) return "warning";
  return "info";
}

function isUpcoming(item: Appointment) {
  return !finishedAppointment.includes(item.status) && new Date(item.scheduled_at).getTime() >= Date.now() - 60 * 60_000;
}

function doctorName(item: Appointment) {
  return item.doctor_profile?.display_name || "your Caretekk doctor";
}

type CareItem = {
  key: string;
  title: string;
  detail: string;
  date: string;
  href: string;
  status: { label: string; tone: PillTone };
};

function careItems(appointments: Appointment[], requests: HomeCareRequestListItem[], patientName: string): CareItem[] {
  const fromAppointments = appointments.map((item) => ({
    key: `appointment-${item.id}`,
    title: "Virtual consultation",
    detail: `${patientName} (me) · Ref. ${item.id}`,
    date: item.scheduled_at,
    href: `/appointments/${item.id}`,
    status: appointmentStatus[item.status] ?? { label: item.status.replace(/_/g, " "), tone: "neutral" as PillTone },
  }));
  const fromRequests = requests.map((item) => ({
    key: `home-care-${item.id}`,
    title: item.service_name_snapshot || "Home care",
    detail: `${patientName} (me) · Ref. ${item.id}`,
    date: item.requested_window_start || item.created_at,
    href: `/home-care/requests/${item.id}`,
    status: { label: homeCareStatusLabel(item.status), tone: homeCareTone(item.status) },
  }));
  return [...fromAppointments, ...fromRequests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

type Activity = { key: string; title: string; date: string; href: string };

/** "Home care request received", "Home care: Nurse on the way" */
function homeCareActivity(status: string) {
  const label = homeCareStatusLabel(status);
  return /^request\b/i.test(label) ? `Home care ${label.toLowerCase()}` : `Home care: ${label}`;
}

function activities(appointments: Appointment[], requests: HomeCareRequestListItem[]): Activity[] {
  const appointmentTitle = (item: Appointment) => {
    const doctor = doctorName(item);
    switch (item.status) {
      case "completed":
        return `Consultation completed with ${doctor}`;
      case "cancelled":
        return `Appointment with ${doctor} cancelled`;
      case "missed":
        return `Missed appointment with ${doctor}`;
      case "pending_payment":
      case "awaiting_payment_verification":
        return `Appointment booked with ${doctor}`;
      default:
        return `Appointment confirmation with ${doctor}`;
    }
  };
  return [
    ...appointments.map((item) => ({ key: `a-${item.id}`, title: appointmentTitle(item), date: item.scheduled_at, href: `/appointments/${item.id}` })),
    ...requests.map((item) => ({
      key: `h-${item.id}`,
      title: `${homeCareActivity(item.status)} (Ref. ${item.id})`,
      date: item.updated_at || item.created_at,
      href: `/home-care/requests/${item.id}`,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function latestThreads(items: Thread[] | undefined) {
  return [...(items ?? [])]
    .filter((thread) => thread.last_message)
    .sort((a, b) => new Date(b.last_message!.created_at).getTime() - new Date(a.last_message!.created_at).getTime());
}

// ---------- building blocks ----------

const tileTones = {
  primary: "bg-primary-50 text-primary-500",
  info: "bg-info-100 text-primary-500",
  warning: "bg-warning-50 text-warning-700",
  success: "bg-success-50 text-success-600",
};

function IconTile({ icon: Icon, tone = "primary", size = "lg" }: { icon: React.ComponentType<{ className?: string }>; tone?: keyof typeof tileTones; size?: "md" | "lg" }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-[8px]", size === "lg" ? "size-[52px]" : "size-10", tileTones[tone])}>
      <Icon className={size === "lg" ? "size-6" : "size-[18px]"} />
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[12px] bg-grey-100", className)} />;
}

function Panel({
  id,
  title,
  action,
  children,
  className,
}: {
  id?: string;
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("overflow-hidden rounded-[24px] border border-grey-200 bg-white", className)}>
      <div className="flex min-h-[72px] items-center justify-between gap-4 border-b border-grey-200 bg-primary-50 px-6 py-4">
        <h2 id={id ? `${id}-title` : undefined} className="type-page-title text-grey-900">
          {title}
        </h2>
        {action ? (
          <Link href={action.href} className={buttonClassName({ variant: "ghost", size: "compact", className: "-mr-4 shrink-0" })}>
            {action.label}
            <ArrowRight className="size-6!" />
          </Link>
        ) : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}

function ListRow({ title, detail, href, pill }: { title: string; detail: string; href: string; pill?: { label: string; tone: PillTone } }) {
  return (
    <li className="flex flex-col gap-3 border-b border-grey-200 pb-5 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-[9px]">
        <IconTile icon={FileText} />
        <div className="grid min-w-0 gap-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="type-body-giant text-black-500">{title}</span>
            {pill ? <Pill tone={pill.tone}>{pill.label}</Pill> : null}
          </p>
          <p className="type-body-md text-grey-500">{detail}</p>
        </div>
      </div>
      <Link href={href} className={buttonClassName({ variant: "neutral", size: "compact", className: "shrink-0 self-start sm:ml-4" })}>
        View details
      </Link>
    </li>
  );
}

function StatCard({
  icon,
  tone,
  label,
  value,
  note,
  noteTone = "muted",
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof tileTones;
  label: string;
  value: number | string;
  note: string;
  noteTone?: "muted" | "alert";
  loading: boolean;
}) {
  return (
    <div className="flex gap-4 rounded-[20px] border border-grey-200 bg-white px-6 py-[22px]">
      <IconTile icon={icon} tone={tone} />
      <div className="grid min-w-0 content-start gap-2">
        <p className="type-body-lg text-grey-500">{label}</p>
        {loading ? <Skeleton className="h-7 w-12" /> : <p className="type-page-title text-black-500">{value}</p>}
        {loading ? <Skeleton className="h-4 w-32" /> : <p className={cn("type-body-md", noteTone === "alert" ? "text-danger-600" : "text-grey-500")}>{note}</p>}
      </div>
    </div>
  );
}

// ---------- page ----------

export function PatientDashboard({ user }: { user: User }) {
  const appointments = useQuery({
    queryKey: ["appointments", "dashboard", "patient"],
    queryFn: () => appointmentsApi.list({ page_size: 20 }),
  });
  const homeCare = useQuery({
    queryKey: ["home-care", "requests", "dashboard"],
    queryFn: () => homeCareApi.requests({ page_size: 20 }),
  });
  const threads = useQuery({
    queryKey: ["threads", "dashboard"],
    queryFn: () => messagingApi.threads({ page_size: 20 }),
  });
  const profile = useQuery({
    queryKey: ["profile", "me", "patient"],
    queryFn: () => profilesApi.me<PatientProfile>(),
  });

  const appointmentList = appointments.data?.results ?? [];
  const requestList = homeCare.data?.results ?? [];
  const patientName = user.full_name || profile.data?.full_name || "You";

  const upcoming = appointmentList.filter(isUpcoming).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const nextAppointment = upcoming[0];
  const activeRequests = requestList.filter((item) => !finishedHomeCare.includes(item.status));
  const awaitingCount = activeRequests.filter((item) => awaitingHomeCare.includes(item.status)).length;
  const conversations = latestThreads(threads.data?.results);
  const unreadTotal = (threads.data?.results ?? []).reduce((sum, thread) => sum + (thread.unread_count ?? 0), 0);
  const lastReply = conversations.find((thread) => thread.last_message && thread.last_message.sender_role !== "patient")?.last_message;
  const care = careItems(appointmentList, requestList, patientName).slice(0, 3);
  const recent = activities(appointmentList, requestList).slice(0, 3);

  const completed = appointmentList.filter((item) => item.status === "completed");
  const appointmentToRate = completed.find(canRateAppointment);
  const ownReviews = completed.filter((item) => item.rating).slice(0, 2);

  const location = [profile.data?.lga, profile.data?.state ? `${profile.data.state} state` : ""].filter(Boolean).join(", ");
  const errors = [
    appointments.isError ? `Appointments: ${getFriendlyErrorMessage(appointments.error, "dashboard")}` : null,
    homeCare.isError ? `Home care: ${getFriendlyErrorMessage(homeCare.error, "dashboard")}` : null,
    threads.isError ? `Messages: ${getFriendlyErrorMessage(threads.error, "dashboard")}` : null,
  ].filter(Boolean);

  return (
    <div className="grid gap-6 lg:gap-10">
      {profile.data && !profile.data.profile_complete ? (
        <Notice title="Complete your profile before booking" tone="warning">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Doctors need your name, phone, age range, gender, state, and LGA before consultation.</span>
            <Link href="/onboarding" className={buttonClassName({ variant: "neutral", size: "compact" })}>
              Complete profile
            </Link>
          </div>
        </Notice>
      ) : null}

      {errors.length ? (
        <Notice title="We're having trouble loading some parts of your dashboard." tone="warning">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span>Some details may be missing for a moment. Please try again.</span>
            <button type="button" onClick={() => window.location.reload()} className={buttonClassName({ variant: "neutral", size: "compact" })}>
              Try again
            </button>
          </div>
        </Notice>
      ) : null}

      {/* Welcome */}
      <section className="flex flex-col gap-6 rounded-[24px] bg-black-500 p-6 sm:p-10 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid content-start gap-6">
          <div className="grid gap-4">
            <p className="w-fit rounded-[12px] bg-black-400 p-2 font-inter-tight text-sm font-medium leading-5 text-grey-300 sm:text-base">
              {location ? `${location} · ` : ""}
              {longDate(new Date())}
            </p>
            <div className="grid gap-1">
              <h2 className="type-heading-4 text-white">
                {greeting()}, {firstName(user.full_name || profile.data?.full_name)}
              </h2>
              <p className="type-body-lg text-grey-300">Welcome back, here&apos;s the overview of your care</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <Link href="#find-care" className={buttonClassName({ variant: "primary" })}>
                Find Healthcare Services
                <ArrowRight />
              </Link>
              <Link href="/appointments" className={buttonClassName({ variant: "inverse" })}>
                View my care
              </Link>
            </div>
          </div>
          <p className="type-body-lg flex items-center gap-2 text-grey-300">
            <BadgeCheck className="size-6 shrink-0" />
            Verified doctors and nurses · private &amp; secure
          </p>
        </div>

        <div className="grid w-full gap-4 rounded-[16px] bg-white p-4 sm:p-5 md:max-w-[420px] xl:w-[297px] xl:shrink-0">
          <div className="flex items-center justify-between gap-3">
            <p className="type-body-lg text-black-500">Next appointment</p>
            {nextAppointment ? <Pill tone={appointmentStatus[nextAppointment.status]?.tone ?? "neutral"}>{appointmentStatus[nextAppointment.status]?.label ?? nextAppointment.status}</Pill> : null}
          </div>
          {appointments.isLoading ? (
            <Skeleton className="h-24" />
          ) : nextAppointment ? (
            <div className="grid gap-3 rounded-[12px] border border-grey-200 bg-grey-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <Pill tone="primary">{dayLabel(nextAppointment.scheduled_at)}</Pill>
                <span className="type-body-sm text-grey-500">{timeOfDay(nextAppointment.scheduled_at)}</span>
              </div>
              <div>
                <p className="type-body-md text-black-500">Virtual consultation</p>
                <p className="type-body-sm truncate text-grey-500">{doctorName(nextAppointment)}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-grey-200 bg-grey-50 p-3">
              <p className="type-body-md text-black-500">No upcoming appointment</p>
              <p className="type-body-sm mt-1 text-grey-500">Book a doctor whenever you need care.</p>
            </div>
          )}
          {nextAppointment ? (
            <Link href={`/appointments/${nextAppointment.id}`} className={buttonClassName({ variant: "primary" })}>
              <Video />
              Join Consultation
            </Link>
          ) : (
            <Link href="/appointments" className={buttonClassName({ variant: "primary" })}>
              Book a doctor
            </Link>
          )}
        </div>
      </section>

      {/* At a glance */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
        <StatCard
          icon={FileText}
          tone="primary"
          label="Active care requests"
          value={activeRequests.length}
          note={awaitingCount ? `${awaitingCount} awaiting confirmation` : "Nothing waiting on you"}
          noteTone={awaitingCount ? "alert" : "muted"}
          loading={homeCare.isLoading}
        />
        <StatCard
          icon={CalendarDays}
          tone="warning"
          label="Upcoming appointments"
          value={upcoming.length}
          note={nextAppointment ? `${dayLabel(nextAppointment.scheduled_at)} at ${timeOfDay(nextAppointment.scheduled_at)}` : "None booked yet"}
          loading={appointments.isLoading}
        />
        <StatCard
          icon={MessageSquareText}
          tone="success"
          label="Unread messages"
          value={unreadTotal}
          note={lastReply ? `${lastReply.sender_name || "Your care team"} replied ${relativeTime(lastReply.created_at)}` : "No new replies"}
          loading={threads.isLoading}
        />
      </div>

      {/*
        Phones only: the sidebar (which has Refer and Earn) is hidden below lg and the bottom nav is
        full, so this keeps the programme reachable. A plain link that reads no programme data, so the
        real terms (percentage, cap, expiry) are only ever shown on /refer.
      */}
      <Link
        href="/refer"
        className="flex items-center gap-4 rounded-[20px] border border-grey-200 bg-white p-4 transition hover:border-grey-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus lg:hidden"
      >
        <IconTile icon={Gift} />
        <span className="min-w-0 flex-1">
          <span className="type-body-giant block text-black-500">Refer &amp; Earn</span>
          <span className="type-body-md mt-1 block text-grey-500">Invite friends and earn Caretekk rewards.</span>
        </span>
        <ArrowRight className="size-6 shrink-0 text-primary-500" />
      </Link>

      {/* Find care: service information only; availability and prices come from the booking pages. */}
      <Panel id="find-care" title="Find care" action={{ href: "/home-care/book", label: "All services" }}>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6">
          <div className="grid content-between gap-6 rounded-[20px] bg-grey-50 p-5">
            <div className="grid gap-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-[9px]">
                  <IconTile icon={FileText} />
                  <h3 className="type-body-giant text-black-500">Virtual consultation</h3>
                </div>
                <Pill tone="success" size="md">Available</Pill>
              </div>
              <div className="grid gap-4">
                <p className="type-body-lg text-grey-500">Speak with a verified doctor from wherever you are.</p>
                <p className="type-body-md flex items-center gap-2 text-grey-500">
                  <Clock className="size-[18px] shrink-0" />
                  Choose a time that suits you
                </p>
              </div>
            </div>
            <Link href="/appointments" className={buttonClassName({ variant: "secondary", size: "compact", className: "w-fit" })}>
              Book Consultation
              <ArrowRight className="size-6!" />
            </Link>
          </div>

          <div className="grid content-between gap-6 rounded-[20px] bg-grey-50 p-5">
            <div className="grid gap-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-[9px]">
                  <IconTile icon={HeartHandshake} />
                  <h3 className="type-body-giant text-black-500">Home care</h3>
                </div>
                <Pill tone="success" size="md">Available</Pill>
              </div>
              <div className="grid gap-4">
                <p className="type-body-lg text-grey-500">Get professional nursing support in the comfort of your home, where available.</p>
                <p className="type-body-md flex items-center gap-2 text-grey-500">
                  <MapPin className="size-[18px] shrink-0" />
                  Akwa Ibom State · Confirmation required
                </p>
              </div>
            </div>
            <Link href="/home-care/book" className={buttonClassName({ variant: "primary", size: "compact", className: "w-fit" })}>
              Explore home care
              <ArrowRight className="size-6!" />
            </Link>
          </div>
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,752fr)_minmax(0,370fr)] xl:gap-x-6 xl:gap-y-10">
        <Panel title="Your care" action={{ href: "/appointments", label: "View my care" }}>
          {appointments.isLoading || homeCare.isLoading ? (
            <div className="grid gap-5">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : care.length ? (
            <ul className="grid gap-5">
              {care.map((item) => (
                <ListRow key={item.key} title={item.title} detail={`${item.detail} · ${shortDate(item.date)}`} href={item.href} pill={item.status} />
              ))}
            </ul>
          ) : (
            <p className="type-body-md text-grey-500">Your consultations and home care requests will appear here.</p>
          )}
        </Panel>

        <Panel title="Upcoming Appointment">
          {appointments.isLoading ? (
            <Skeleton className="h-[229px]" />
          ) : upcoming.length ? (
            <ul className="grid gap-3">
              {upcoming.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <Link href={`/appointments/${item.id}`} className="grid gap-2 rounded-[12px] border border-grey-200 bg-grey-50 p-3 transition hover:border-grey-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus">
                    <span className="flex items-center justify-between gap-3">
                      <Pill tone="primary">{dayLabel(item.scheduled_at)}</Pill>
                      <span className="type-body-sm text-grey-500">{timeOfDay(item.scheduled_at)}</span>
                    </span>
                    <span className="type-body-md text-black-500">Virtual consultation</span>
                    <span className="type-body-sm truncate text-grey-500">{doctorName(item)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex min-h-[229px] flex-col items-center justify-center gap-3 rounded-[12px] border-[1.4px] border-grey-200 px-6 text-center">
              <IconTile icon={CalendarDays} tone="info" />
              <p className="type-body-md max-w-[216px] text-grey-500">No upcoming appointment yet. Once confirmed, it will appear here.</p>
            </div>
          )}
        </Panel>

        <Panel title="Recent activities" action={{ href: "/appointments", label: "View History" }}>
          {appointments.isLoading || homeCare.isLoading ? (
            <div className="grid gap-5">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : recent.length ? (
            <ul className="grid gap-5">
              {recent.map((item) => (
                <ListRow key={item.key} title={item.title} detail={activityTime(item.date)} href={item.href} />
              ))}
            </ul>
          ) : (
            <p className="type-body-md text-grey-500">Updates about your care will appear here.</p>
          )}
        </Panel>

        <Panel title="Messages">
          <div className="grid gap-4">
            {threads.isLoading ? (
              <>
                <Skeleton className="h-[70px]" />
                <Skeleton className="h-[70px]" />
              </>
            ) : conversations.length ? (
              conversations.slice(0, 2).map((thread) => (
                <Link
                  key={thread.id}
                  href="/messages"
                  className="flex items-center justify-between gap-3 rounded-[12px] bg-primary-50 p-[13px] transition hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border-[1.5px] border-success-200 bg-success-50 text-success-600">
                      <MessageSquareText className="size-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="type-body-giant block truncate text-black-500">{thread.doctor_profile?.display_name || "Care team message"}</span>
                      <span className="type-body-md block truncate text-grey-500">{thread.unread_count ? "Unread" : thread.last_message?.body || "Read"}</span>
                    </span>
                  </span>
                  {thread.unread_count ? (
                    <span className="shrink-0 rounded-full border border-success-200 bg-success-50 px-1.5 font-inter-tight text-base font-medium leading-5 text-success-700">
                      {thread.unread_count}
                    </span>
                  ) : null}
                </Link>
              ))
            ) : (
              <p className="type-body-md text-grey-500">Messages from your doctors and care team will appear here.</p>
            )}
            <Link href="/messages" className={buttonClassName({ variant: "neutral", className: "mt-4" })}>
              {conversations.length ? "Reply in message" : "Open messages"}
            </Link>
          </div>
        </Panel>
      </div>

      {appointmentToRate || ownReviews.length ? (
        <Panel title="Your feedback" action={{ href: "/appointments", label: "View all" }}>
          <div className="grid gap-4">
            {appointmentToRate ? (
              <div>
                <p className="type-body-md mb-2 text-grey-500">
                  {doctorName(appointmentToRate)} · {activityTime(appointmentToRate.scheduled_at)}
                </p>
                <ConsultationReviewForm key={appointmentToRate.id} appointmentId={appointmentToRate.id} />
              </div>
            ) : null}
            {ownReviews.map((item) => (
              <div key={item.id}>
                <p className="type-body-md mb-2 text-grey-500">
                  {doctorName(item)} · {activityTime(item.scheduled_at)}
                </p>
                <ConsultationReviewSummary rating={item.rating!} />
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
