import { HeartPulse, Home, ShieldCheck, Sparkles, UserRoundCheck, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

import {
  DoctorVisitIcon,
  ElderlyCareIcon,
  HomeNursingIcon,
  MaternalCareIcon,
} from "@/components/marketing/service-icons";
import {
  DocumentsBadgeIcon,
  FastForwardBadgeIcon,
  HomeBadgeIcon,
  MoneyBadgeIcon,
  VideoBadgeIcon,
} from "@/components/marketing/solution-icons";

export const marketingNavItems = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Caretekk", href: "#trust" },
  { label: "FAQ", href: "#faq" },
];

export const platformStats: Array<{ value: number; suffix: string; label: string }> = [
  { value: 1200, suffix: "+", label: "Consultations & visits" },
  { value: 8, suffix: "min", label: "Avg. connect time" },
  { value: 50, suffix: "+", label: "Vetted doctors & nurses" },
  { value: 3, suffix: "", label: "Lagos, Abuja, PH" },
];

export const platformHighlights: Array<{
  title: string;
  text: string;
  icon: ComponentType<{ className?: string }>;
  tone: "light" | "dark";
}> = [
  {
    title: "Medical advice without the wait",
    text: "Consult a licensed doctor virtually in minutes, from anywhere in Nigeria no travel, no queue.",
    icon: VideoBadgeIcon,
    tone: "dark",
  },
  {
    title: "Someone there, when it matters.",
    text: "Book a vetted nurse or caregiver for home visits in the cities we serve.",
    icon: HomeBadgeIcon,
    tone: "light",
  },
  {
    title: "Every professional is verified.",
    text: "Licensed, credential-checked, and background-checked whether they're consulting you remotely or at your door.",
    icon: DocumentsBadgeIcon,
    tone: "light",
  },
  {
    title: "Fast, honest confirmation",
    text: "Virtual consultations connect you in minutes. Homecare visits are matched quickly, with same-day availability where we have providers nearby.",
    icon: FastForwardBadgeIcon,
    tone: "light",
  },
  {
    title: "Affordable from the start.",
    text: "See a doctor from ₦2,000, or book home care from ₦5,000 no surprise costs.",
    icon: MoneyBadgeIcon,
    tone: "light",
  },
];

export const serviceOffers: Array<{
  title: string;
  text: string;
  cta: string;
  href: string;
  image: string;
  alt: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    title: "On-Demand Doctor Visits",
    text: "Talk to a licensed doctor virtually, anywhere in Nigeria confirmed in minutes, from ₦2,000.",
    cta: "Talk to a Doctor",
    href: "/register",
    image: "/img/services/doctor-visit.webp",
    alt: "Doctor reviewing notes with a patient",
    icon: DoctorVisitIcon,
  },
  {
    title: "Home Healthcare & Nursing",
    text: "Home nursing, mother & baby care from registered midwives. Same-day, from ₦5,000.",
    cta: "Book a Nursing Visit",
    href: "/register",
    image: "/img/services/home-nursing.webp",
    alt: "Doctor in a white coat speaking with a patient",
    icon: HomeNursingIcon,
  },
  {
    title: "Elderly Care Support",
    text: "Daily support for aging parents check-ins, medication, mobility help matched to your family.",
    cta: "Book Elderly Care",
    href: "/register",
    image: "/img/services/elderly-care.webp",
    alt: "Health worker checking an older woman's blood pressure",
    icon: ElderlyCareIcon,
  },
  {
    title: "Maternal & Postpartum Care",
    text: "Virtual doctor support, plus in-person mother and baby care from our registered midwives.",
    cta: "Get Maternal Care Support",
    href: "/register",
    image: "/img/services/maternal-care.webp",
    alt: "Mother resting in bed with her newborn",
    icon: MaternalCareIcon,
  },
];

export const trustItems: Array<{ title: string; text: string; icon: LucideIcon }> = [
  {
    title: "Verified doctors",
    text: "Consult trusted clinicians with follow-up care kept close.",
    icon: UserRoundCheck,
  },
  {
    title: "Licensed nurses",
    text: "Book home-care support for recovery, routine care, and family needs.",
    icon: Home,
  },
  {
    title: "Secure payments",
    text: "Protected checkout for consultations and home-care bookings.",
    icon: ShieldCheck,
  },
  {
    title: "24/7 access",
    text: "Start care, check updates, and keep next steps in one place.",
    icon: Sparkles,
  },
  {
    title: "Live consultations",
    text: "Messages, care plans, and follow-up support stay connected.",
    icon: HeartPulse,
  },
];

export const doctors = [
  { name: "Dr. Idam Michael Ogudu", image: "/img/Dr michael Idam.jpg" },
  { name: "Dr. Effiong Okon Etim", image: "/img/Dr effiong Okon.jpg" },
  { name: "Dr. Paul Chinonso Ogbogu", image: "/img/Dr Paul Chinonso.jpg" },
  { name: "Dr. Moronu Ekene", image: "/img/Dr Ekene.jpg" },
];

export const heroSlides: Array<{
  lead: string;
  highlight: string;
  tail: string;
  highlightClassName: string;
  text: string;
  image: string;
  alt: string;
}> = [
  {
    lead: "A Doctor’s",
    highlight: "Opinion,",
    tail: "Minutes Away",
    highlightClassName: "bg-[#362FAA]",
    text: "Connect with a licensed doctor virtually, wherever you are in Nigeria confirmed in minutes, from ₦2,000.",
    image: "/img/team-consult.webp",
    alt: "Caretekk doctors ready for a virtual consultation",
  },
  {
    lead: "Real Care",
    highlight: "Right",
    tail: "at Your Door",
    highlightClassName: "bg-[#1A2241]",
    text: "Book a vetted nurse or caregiver for in-home care in Akwa Ibom from ₦5,000.",
    image: "/img/team-homecare.webp",
    alt: "Caretekk care team available for home visits",
  },
];

export const heroStats = [
  { value: "General medicine", label: "doctor consultations without leaving home" },
  { value: "Mother & baby care", label: "guided care for growing families and recovery" },
  { value: "Homecare support", label: "elderly care, recovery visits, and routine check-ins" },
];

export const howItWorksSteps = [
  {
    id: "01",
    title: "Create your account",
    text: "Start with your email and move through a guided onboarding flow built around trust.",
  },
  {
    id: "02",
    title: "Confirm your email",
    text: "Verify your account with a 6-digit code before you continue into care.",
  },
  {
    id: "03",
    title: "Choose your care path",
    text: "Book a doctor, request a nurse, or start your care check-in with confidence.",
  },
  {
    id: "04",
    title: "Stay connected",
    text: "Messages, updates, records, and follow-up care stay together in one calm workspace.",
  },
];

export const footerLinks = [
  { label: "Doctors", href: "#doctors" },
  { label: "Home Care", href: "#home-care" },
  { label: "Trust", href: "#trust" },
];
