"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  buttonClassName,
  CalendarIcon,
  ClockIcon,
  GiftIcon,
  GoogleDocsIcon,
  HealthcareIcon,
  MessageTextIcon,
  Pill,
  type PillTone,
  TwitterVerifiedBadgeIcon,
  VideoCameraIcon,
} from "@/components/ds";
import { Notice } from "@/components/ui/notice";
import { homeCareStatusLabel } from "@/features/homecare/homecare-utils";
import { appointmentsApi, homeCareApi, messagingApi, profilesApi } from "@/lib/api/endpoints";
import { getFriendlyErrorMessage } from "@/lib/ui/error-copy";
import type { Appointment, AppointmentStatus, HomeCareRequestListItem, PatientProfile, Thread, User } from "@/lib/types/backend";
import { cn } from "@/lib/utils";

// Patient dashboard built to the Figma "Dashboard- filled" screen (FINAL DESIGN page, light background
// version) with the design system. Copy, sizes and colours follow the Figma frame; content is the
// patient's real appointments, home care requests and messages.

// ---------- formatting ----------

// All dates and times are shown in Nigerian time (WAT), where consultations and home visits happen,
// so every card agrees whatever timezone the patient's device is set to.
const TIME_ZONE = "Africa/Lagos";

function ordinal(day: number) {
  const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  return `${day}${suffix}`;
}

function parts(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const get = (type: string) =>
    new Intl.DateTimeFormat("en", { timeZone: TIME_ZONE, year: "numeric", month: "short", day: "numeric" })
      .formatToParts(date)
      .find((part) => part.type === type)?.value ?? "";
  return { year: Number(get("year")), month: get("month"), day: Number(get("day")) };
}

/** "Nov. 17th, 2026" */
function longDate(value: Date | string) {
  const { year, month, day } = parts(value);
  return `${month}. ${ordinal(day)}, ${year}`;
}

/** "14th Nov, 2026" */
function shortDate(value: string) {
  const { year, month, day } = parts(value);
  return `${ordinal(day)} ${month}, ${year}`;
}

function time(value: string) {
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TIME_ZONE })
    .format(new Date(value))
    .replace(/\s/g, "");
}

/** "4:30pm" */
function clock(value: string) {
  return time(value).toLowerCase();
}

/** "4:30PM WAT" */
function clockWat(value: string) {
  return `${time(value)} WAT`;
}

function dayLabel(value: string) {
  const dayNumber = (d: Date | string) => {
    const { year, month, day } = parts(d);
    return Date.UTC(year, ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(month), day) / 86_400_000;
  };
  const diff = dayNumber(value) - dayNumber(new Date());
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const { month, day } = parts(value);
  return `${month} ${ordinal(day)}`;
}

/** "Yesterday, 6:30pm" / "19th Nov, 2026, 8:00am" */
function activityTime(value: string) {
  const label = dayLabel(value);
  return `${["Today", "Tomorrow", "Yesterday"].includes(label) ? label : shortDate(value)}, ${clock(value)}`;
}

/** "20 mins ago" */
function ago(value: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function greeting() {
  const hour = Number(new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone: TIME_ZONE }).format(new Date()));
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(value?: string | null) {
  return value?.trim().split(/\s+/)[0] || "there";
}

function doctorName(item: Appointment) {
  const name = item.doctor_profile?.display_name?.trim();
  if (!name) return "your Caretekk doctor";
  return /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;
}

// ---------- status ----------

const finishedAppointment: AppointmentStatus[] = ["completed", "cancelled", "missed"];
const finishedHomeCare = ["care_completed", "patient_confirmed", "cancelled", "match_failed"];
const awaitingHomeCare = ["requested", "awaiting_payment", "awaiting_payment_verification", "matching", "assigned", "verification_in_progress", "awaiting_patient_confirmation"];

type Status = { label: string; tone: PillTone } | null;

/** Pills on "Your care" rows; finished items show none, as on the Figma screen. */
function appointmentPill(status: AppointmentStatus): Status {
  switch (status) {
    case "confirmed":
    case "scheduled":
    case "accepted":
      return { label: "Received - waiting consultation", tone: "warning" };
    case "pending_payment":
      return { label: "Awaiting payment", tone: "warning" };
    case "awaiting_payment_verification":
      return { label: "Payment being verified", tone: "warning" };
    case "payment_rejected":
      return { label: "Payment not confirmed", tone: "danger" };
    case "in_progress":
      return { label: "In progress", tone: "info" };
    case "cancelled":
      return { label: "Cancelled", tone: "danger" };
    default:
      return null;
  }
}

function homeCarePill(status: string): Status {
  if (status === "cancelled" || status === "match_failed" || status === "payment_rejected" || status === "unreachable") {
    return { label: homeCareStatusLabel(status), tone: "danger" };
  }
  if (finishedHomeCare.includes(status)) return null;
  return { label: homeCareStatusLabel(status), tone: awaitingHomeCare.includes(status) ? "warning" : "info" };
}

function isUpcoming(item: Appointment) {
  return !finishedAppointment.includes(item.status) && new Date(item.scheduled_at).getTime() >= Date.now() - 60 * 60_000;
}

type CareItem = { key: string; title: string; reference: string; date: string; href: string; pill: Status };

function careItems(appointments: Appointment[], requests: HomeCareRequestListItem[], patientName: string): CareItem[] {
  return [
    ...appointments.map((item) => ({
      key: `appointment-${item.id}`,
      title: "Virtual consultation",
      reference: `${patientName} (me) - CTK - ${item.id}`,
      date: item.scheduled_at,
      href: `/appointments/${item.id}`,
      pill: appointmentPill(item.status),
    })),
    ...requests.map((item) => ({
      key: `home-care-${item.id}`,
      title: item.service_name_snapshot || "Home care",
      reference: `${patientName} (me) - CTK - ${item.id}`,
      date: item.requested_window_start || item.created_at,
      href: `/home-care/requests/${item.id}`,
      pill: homeCarePill(item.status),
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

type Activity = { key: string; title: string; date: string; href: string };

function appointmentActivity(item: Appointment) {
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
}

/** "Home care request received (CTK - 360)" */
function homeCareActivity(item: HomeCareRequestListItem) {
  const label = homeCareStatusLabel(item.status);
  const title = /^request\b/i.test(label) ? `Home care ${label.toLowerCase()}` : `Home care: ${label}`;
  return `${title} (CTK - ${item.id})`;
}

function activities(appointments: Appointment[], requests: HomeCareRequestListItem[]): Activity[] {
  return [
    ...appointments.map((item) => ({ key: `a-${item.id}`, title: appointmentActivity(item), date: item.scheduled_at, href: `/appointments/${item.id}` })),
    ...requests.map((item) => ({ key: `h-${item.id}`, title: homeCareActivity(item), date: item.updated_at || item.created_at, href: `/home-care/requests/${item.id}` })),
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
  info: "bg-info-100 text-info-500",
  warning: "bg-warning-50 text-warning-500",
  success: "bg-success-50 text-success-500",
};

/** Figma: 52px tile, 8px radius, 24px icon. */
function IconTile({ icon: Icon, tone = "primary" }: { icon: React.ComponentType<{ className?: string }>; tone?: keyof typeof tileTones }) {
  return (
    <span className={cn("flex size-[52px] shrink-0 items-center justify-center rounded-[8px]", tileTones[tone])}>
      <Icon className="size-6" />
    </span>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[12px] bg-grey-100", className)} />;
}

/** Figma section: 24px radius, grey-200 border, 72px primary-50 header (Manrope 24/28 bold), 24px side padding. */
function Panel({
  id,
  title,
  action,
  children,
  bodyClassName = "px-6 pb-5 pt-8",
  className,
}: {
  id?: string;
  title: string;
  action?: { href: string; label: string };
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-title` : undefined} className={cn("overflow-hidden rounded-[24px] border border-grey-200 bg-white", className)}>
      <div className="flex min-h-[72px] items-center justify-between gap-4 border-b border-grey-200 bg-primary-50 px-6 py-4">
        <h2 id={id ? `${id}-title` : undefined} className="type-page-title text-black">
          {title}
        </h2>
        {action ? (
          <Link href={action.href} className={buttonClassName({ variant: "ghost", size: "compact", className: "-mr-4 shrink-0" })}>
            {action.label}
            <ArrowRightIcon className="size-6!" />
          </Link>
        ) : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

function ListRow({ title, detail, date, href, pill }: { title: string; detail: string; date?: string; href: string; pill?: Status }) {
  return (
    <li className="flex flex-col gap-3 border-b border-grey-200 pb-5 last:border-b-0 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-[9px]">
        <IconTile icon={GoogleDocsIcon} />
        <div className="grid min-w-0 content-start gap-1">
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="type-body-giant text-black-500">{title}</span>
            {pill ? <Pill tone={pill.tone}>{pill.label}</Pill> : null}
          </p>
          <p className="type-body-md flex flex-wrap gap-x-1 text-grey-500">
            <span>{detail}</span>
            {date ? <span>{date}</span> : null}
          </p>
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
  alert,
  loading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: keyof typeof tileTones;
  label: string;
  value: number;
  note: string;
  alert?: boolean;
  loading: boolean;
}) {
  return (
    <div className="flex gap-4 rounded-[20px] border border-grey-200 bg-white px-6 py-[22px]">
      <IconTile icon={icon} tone={tone} />
      <div className="grid min-w-0 content-start gap-2">
        <p className="type-body-lg text-grey-500">{label}</p>
        {loading ? <Skeleton className="h-7 w-12" /> : <p className="type-page-title text-black-500">{value}</p>}
        {loading ? <Skeleton className="h-4 w-32" /> : <p className={cn("type-body-md", alert ? "text-danger-500" : "text-grey-500")}>{note}</p>}
      </div>
    </div>
  );
}

function ServiceCard({
  icon,
  title,
  description,
  meta,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  meta: string;
  action: React.ReactNode;
}) {
  return (
    <div className="grid content-between gap-6 rounded-[20px] bg-grey-50 p-5">
      <div className="grid gap-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-[9px]">
            <IconTile icon={icon} />
            <h3 className="type-body-giant text-black-500">{title}</h3>
          </div>
          <Pill tone="success" size="md">
            Available now
          </Pill>
        </div>
        <div className="grid gap-4">
          <p className="type-body-lg text-grey-500">{description}</p>
          <p className="type-body-md flex items-center gap-2 text-grey-500">
            <ClockIcon className="size-[18px] shrink-0" />
            {meta}
          </p>
        </div>
      </div>
      {action}
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
  const lastReply = conversations.find((thread) => thread.last_message?.sender_role !== "patient")?.last_message;
  const care = careItems(appointmentList, requestList, patientName).slice(0, 3);
  const recent = activities(appointmentList, requestList).slice(0, 3);

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

      {/* Welcome: Figma 312px card, 24px radius, black-500, 40px padding */}
      <section className="flex flex-col gap-6 rounded-[24px] bg-black-500 p-6 sm:p-10 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid content-start gap-6">
          <div className="grid gap-4">
            <p className="w-fit rounded-[12px] bg-black-400 p-2 font-inter-tight text-sm font-medium leading-5 text-grey-300 sm:text-base">
              {location ? `${location} - ` : ""}
              {longDate(new Date())}
            </p>
            <div className="grid gap-6">
              <div className="grid gap-1">
                <h2 className="type-heading-4 text-white">
                  {greeting()}, {firstName(user.full_name || profile.data?.full_name)}
                </h2>
                <p className="type-body-lg text-grey-300">Welcome back, Here&apos;s the overview of your care</p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="#find-care" className={buttonClassName({ variant: "primary" })}>
                  <ArrowLeftIcon />
                  Find Healthcare Services
                </Link>
                <Link href="/appointments" className={buttonClassName({ variant: "inverse" })}>
                  View my care
                </Link>
              </div>
            </div>
          </div>
          <p className="type-body-lg flex items-center gap-2 text-grey-300">
            <TwitterVerifiedBadgeIcon className="size-6 shrink-0" />
            Verified doctors and nurses - private &amp; secured
          </p>
        </div>

        <div className="grid w-full gap-4 rounded-[16px] bg-white p-5 md:max-w-[420px] xl:w-[297px] xl:shrink-0">
          <div className="flex items-center justify-between gap-3">
            <p className="type-body-lg text-black">Next appointment</p>
            {nextAppointment ? (
              <Pill tone="success" bordered={false}>
                {nextAppointment.status === "in_progress" ? "In progress" : nextAppointment.status === "pending_payment" || nextAppointment.status === "awaiting_payment_verification" ? "Pending" : "Confirmed"}
              </Pill>
            ) : null}
          </div>
          {appointments.isLoading ? (
            <Skeleton className="h-24" />
          ) : nextAppointment ? (
            <div className="grid gap-3 rounded-[12px] border border-grey-200 bg-grey-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <Pill tone="primary">{dayLabel(nextAppointment.scheduled_at)}</Pill>
                <span className="type-body-sm text-grey-500">{clockWat(nextAppointment.scheduled_at)}</span>
              </div>
              <div>
                <p className="type-body-md text-black">Virtual consultation</p>
                <p className="type-body-sm truncate text-grey-500">{doctorName(nextAppointment)}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[12px] border border-grey-200 bg-grey-50 p-3">
              <p className="type-body-md text-black">No upcoming appointment</p>
              <p className="type-body-sm mt-1 text-grey-500">Book a doctor whenever you need care.</p>
            </div>
          )}
          {nextAppointment ? (
            <Link href={`/appointments/${nextAppointment.id}`} className={buttonClassName({ variant: "primary" })}>
              <VideoCameraIcon />
              Join Consultation
            </Link>
          ) : (
            <Link href="/appointments" className={buttonClassName({ variant: "primary" })}>
              Book Consultation
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-4">
        <StatCard
          icon={GoogleDocsIcon}
          tone="primary"
          label="Active Care Request"
          value={activeRequests.length}
          note={`${awaitingCount} await confirmation`}
          alert={awaitingCount > 0}
          loading={homeCare.isLoading}
        />
        <StatCard
          icon={CalendarIcon}
          tone="warning"
          label="Upcoming appointment"
          value={upcoming.length}
          note={nextAppointment ? `${dayLabel(nextAppointment.scheduled_at)} by ${clock(nextAppointment.scheduled_at)}` : "No upcoming appointment"}
          loading={appointments.isLoading}
        />
        <StatCard
          icon={MessageTextIcon}
          tone="success"
          label="Unread messages"
          value={unreadTotal}
          note={lastReply ? `Caretekk team replied ${ago(lastReply.created_at)}` : "No new messages"}
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
        <IconTile icon={GiftIcon} />
        <span className="min-w-0 flex-1">
          <span className="type-body-giant block text-black-500">Refer &amp; Earn</span>
          <span className="type-body-md mt-1 block text-grey-500">Invite friends and earn Caretekk rewards.</span>
        </span>
        <ArrowRightIcon className="size-6 shrink-0 text-primary-500" />
      </Link>

      <Panel id="find-care" title="Find care" action={{ href: "/home-care/book", label: "All services" }} bodyClassName="p-6 pt-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,340px),1fr))] gap-6">
          <ServiceCard
            icon={GoogleDocsIcon}
            title="Virtual consultation"
            description="Speak with a verified doctor from wherever you are."
            meta="Available today - Avg. wait 25mins"
            action={
              <Link href="/appointments" className={buttonClassName({ variant: "secondary", size: "compact", className: "w-fit" })}>
                Book Consultation
                <ArrowRightIcon className="size-6!" />
              </Link>
            }
          />
          <ServiceCard
            icon={HealthcareIcon}
            title="Home care"
            description="Get professional nursing support in the comfort of your home, where available."
            meta="Uyo, Akwa Ibom state - Confirmation required"
            action={
              <Link href="/home-care/book" className={buttonClassName({ variant: "primary", size: "compact", className: "w-fit" })}>
                Explore home care
                <ArrowRightIcon className="size-6!" />
              </Link>
            }
          />
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
                <ListRow key={item.key} title={item.title} detail={item.reference} date={shortDate(item.date)} href={item.href} pill={item.pill} />
              ))}
            </ul>
          ) : (
            <p className="type-body-md pb-3 text-grey-500">Your consultations and home care requests will appear here.</p>
          )}
        </Panel>

        <Panel title="Upcoming Appointment">
          {appointments.isLoading ? (
            <Skeleton className="h-[229px]" />
          ) : upcoming.length ? (
            <ul className="grid gap-3 pb-3">
              {upcoming.slice(0, 3).map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/appointments/${item.id}`}
                    className="grid gap-3 rounded-[12px] border border-grey-200 bg-grey-50 p-3 transition hover:border-grey-400 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-focus"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <Pill tone="primary">{dayLabel(item.scheduled_at)}</Pill>
                      <span className="type-body-sm text-grey-500">{clockWat(item.scheduled_at)}</span>
                    </span>
                    <span>
                      <span className="type-body-md block text-black">Virtual consultation</span>
                      <span className="type-body-sm block truncate text-grey-500">{doctorName(item)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mb-[31px] flex min-h-[229px] flex-col items-center justify-center gap-3 rounded-[12px] border-[1.4px] border-grey-200 px-6 text-center">
              <IconTile icon={CalendarIcon} tone="info" />
              <p className="type-body-md max-w-[216px] text-grey-500">No new appointment yet. Once confirmed, it will appear here.</p>
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
            <p className="type-body-md pb-3 text-grey-500">Updates about your care will appear here.</p>
          )}
        </Panel>

        <Panel title="Messages" bodyClassName="px-6 pb-6 pt-4">
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
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-[8px] border-[1.5px] border-success-200 bg-success-50 text-success-500">
                      <MessageTextIcon className="size-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="type-body-giant block truncate text-black-500">Care team message</span>
                      <span className="type-body-md block text-grey-500">{thread.unread_count ? "Unread" : "Read"}</span>
                    </span>
                  </span>
                  {thread.unread_count ? (
                    <span className="shrink-0 rounded-full border border-success-200 bg-success-50 px-1 font-inter-tight text-base font-medium leading-5 text-success-500">
                      {thread.unread_count}
                    </span>
                  ) : null}
                </Link>
              ))
            ) : (
              <p className="type-body-md text-grey-500">Messages from your doctors and care team will appear here.</p>
            )}
            <Link href="/messages" className={buttonClassName({ variant: "neutral", className: "mt-4" })}>
              Reply in message
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
