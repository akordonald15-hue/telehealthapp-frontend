import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  HeartPulse,
  Home,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";

export const marketingNavItems = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Doctors", href: "#doctors" },
  { label: "Home Care", href: "#home-care" },
  { label: "Contact", href: "#contact" },
];

export const trustItems: Array<{ title: string; text: string; icon: LucideIcon }> = [
  {
    title: "Secure consultations",
    text: "Private conversations, verified access, and dependable follow-up.",
    icon: ShieldCheck,
  },
  {
    title: "Verified doctors",
    text: "Trusted clinicians for everyday medical guidance and follow-up care.",
    icon: UserRoundCheck,
  },
  {
    title: "Protected records",
    text: "Records, notes, and referrals stay organised and easy to revisit.",
    icon: FileText,
  },
  {
    title: "Home care ready",
    text: "Telehealth and nurse visits stay connected in one care journey.",
    icon: Home,
  },
];

export const doctors = [
  {
    name: "Dr. Idam Michael Ogudu",
    specialty: "Obstetrics & Gynecology | General Medicine",
    qualification: "MBBS",
    experience: "Licensed for 2023/2024 practice",
    image: "/img/Dr michael Idam.jpg",
    bio: "Supports women's health, general consultation, and follow-up care.",
  },
  {
    name: "Dr. Effiong Okon Etim",
    specialty: "General Medicine",
    qualification: "MBBS",
    experience: "Primary care and routine consultation",
    image: "/img/Dr effiong Okon.jpg",
    bio: "Provides everyday medical guidance, assessment, and follow-up support.",
  },
  {
    name: "Dr. Paul Chinonso Ogbogu",
    specialty: "Obstetrics & Gynecology | Internal Medicine | Surgery",
    qualification: "MBBS",
    experience: "Multidisciplinary care",
    image: "/img/Dr Paul Chinonso.jpg",
    bio: "Supports complex care needs across internal medicine, surgery, and women's health.",
  },
  {
    name: "Dr. Moronu Ekene",
    specialty: "Orthopaedics | General Medicine",
    qualification: "MBBS",
    experience: "Bone, joint, and general care",
    image: "/img/Dr Ekene.jpg",
    bio: "Cares for musculoskeletal concerns while supporting general medical follow-up.",
  },
];

export const features: Array<{ title: string; text: string; icon: LucideIcon }> = [
  {
    title: "Appointments",
    text: "Book consultations and keep each step clear with status updates and reminders.",
    icon: CalendarDays,
  },
  {
    title: "Secure messaging",
    text: "Continue conversations with your doctor in one calm consultation space.",
    icon: MessageSquare,
  },
  {
    title: "Medical records",
    text: "Keep notes and uploads organised around each patient journey.",
    icon: FileText,
  },
  {
    title: "Care plans",
    text: "Review doctor notes, follow-up guidance, and referrals in one place.",
    icon: ClipboardList,
  },
  {
    title: "Care check-in",
    text: "Share symptoms, get guided direction, and move into the right next step faster.",
    icon: Sparkles,
  },
  {
    title: "Service checkout",
    text: "Pay inside booked consultation and home care flows with secure checkout.",
    icon: CreditCard,
  },
  {
    title: "Home care nurses",
    text: "Coordinate requests, pre-visit confirmation, travel, and care completion.",
    icon: Home,
  },
  {
    title: "Follow-up support",
    text: "Keep consultations, care plans, and on-the-ground updates connected.",
    icon: HeartPulse,
  },
];

export const heroStats = [
  { value: "Doctors", label: "consult verified clinicians for everyday health concerns" },
  { value: "Home care", label: "request trusted nurses for guided visits at home" },
  { value: "Follow-up", label: "keep records, referrals, and messages connected" },
];

export const howItWorksSteps = [
  {
    id: "01",
    title: "Create your patient account",
    text: "Start with your details and move into a guided onboarding flow built around trust.",
  },
  {
    id: "02",
    title: "Confirm your email",
    text: "Verify your account before you move into sign-in and your first care check-in.",
  },
  {
    id: "03",
    title: "Complete your care check-in",
    text: "Share symptoms first so we can guide you toward the right doctor or care support path.",
  },
  {
    id: "04",
    title: "Continue with care",
    text: "Move into consultation, appointments, home visits, records, care plans, and follow-up in one place.",
  },
];

export const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "Doctors", href: "#doctors" },
  { label: "Home Care", href: "#home-care" },
];
