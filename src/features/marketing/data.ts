import { HeartPulse, Home, ShieldCheck, Sparkles, UserRoundCheck, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";

import {
  BanknoteSolidIcon,
  HouseSolidIcon,
  ShieldCheckSolidIcon,
  StopwatchSolidIcon,
  VideoSolidIcon,
} from "@/components/marketing/marketing-icons";

export const marketingNavItems = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Caretekk", href: "#trust" },
  // No FAQ section exists yet — placeholder anchor.
  { label: "FAQ", href: "#faq" },
];

export const platformHighlights: Array<{
  title: string;
  text: string;
  icon: ComponentType<{ className?: string }>;
  tone: "light" | "dark";
}> = [
  {
    title: "Medical advice without the wait",
    text: "Consult a licensed doctor virtually in minutes, from anywhere in Nigeria — no travel, no queue.",
    icon: VideoSolidIcon,
    tone: "light",
  },
  {
    title: "Hands-on care when someone needs to be there in person.",
    text: "Book a vetted nurse or caregiver for home visits in the cities we serve.",
    icon: HouseSolidIcon,
    tone: "dark",
  },
  {
    title: "Every professional is verified.",
    text: "Licensed, credential-checked, and background-checked whether they're consulting you remotely or at your door.",
    icon: ShieldCheckSolidIcon,
    tone: "dark",
  },
  {
    title: "Fast, honest confirmation",
    text: "Virtual consultations connect you in minutes. Homecare visits are matched quickly, with same-day availability where we have providers nearby.",
    icon: StopwatchSolidIcon,
    tone: "light",
  },
  {
    title: "Affordable from the start.",
    text: "See a doctor from ₦2,000, or book home care from ₦5,000 — no surprise costs.",
    icon: BanknoteSolidIcon,
    tone: "light",
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
