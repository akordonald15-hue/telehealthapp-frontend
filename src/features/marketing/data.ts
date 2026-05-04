import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  HeartPulse,
  Home,
  MessageSquare,
  type LucideIcon,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

export const marketingNavItems = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Doctors", href: "#doctors" },
  { label: "Home Care", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

export const trustItems: Array<{ title: string; text: string; icon: LucideIcon }> = [
  {
    title: "Secure consultations",
    text: "Protected care conversations, verified access, and thoughtful follow-up.",
    icon: ShieldCheck,
  },
  {
    title: "Verified doctors",
    text: "Trusted clinicians for general medical consultation and follow-up care.",
    icon: UserRoundCheck,
  },
  {
    title: "Protected records",
    text: "Medical files, notes, and referrals stay organized and easy to revisit.",
    icon: FileText,
  },
  {
    title: "Home care ready",
    text: "Telehealth and nurse-led visits can live in one connected care journey.",
    icon: Home,
  },
];

export const doctors = [
  {
    name: "Dr. Michael Idam",
    specialty: "Doctor",
    qualification: "",
    experience: "Caretekk doctor",
    image: "/img/Dr michael Idam.jpg",
    bio: "",
  },
  {
    name: "Dr. Effiong Okon",
    specialty: "Doctor",
    qualification: "",
    experience: "Caretekk doctor",
    image: "/img/Dr effiong Okon.jpg",
    bio: "",
  },
  {
    name: "Dr. Paul Ogbogu",
    specialty: "Doctor",
    qualification: "",
    experience: "Caretekk doctor",
    image: "/img/Dr Paul Chinonso.jpg",
    bio: "",
  },
  {
    name: "Dr. Moronu Ekene",
    specialty: "Doctor",
    qualification: "",
    experience: "Caretekk doctor",
    image: "/img/Dr Ekene.jpg",
    bio: "",
  },
];

export const features: Array<{ title: string; text: string; icon: LucideIcon }> = [
  {
    title: "Appointments",
    text: "Book and manage consultations with clear status updates and reminders.",
    icon: CalendarDays,
  },
  {
    title: "Secure messaging",
    text: "Continue care conversations with doctors in one calm consultation space.",
    icon: MessageSquare,
  },
  {
    title: "Medical records",
    text: "Keep notes and file uploads organized around each patient journey.",
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
    text: "Pay only inside booked consultation and homecare flows with secure Paystack checkout.",
    icon: CreditCard,
  },
  {
    title: "Home care nurses",
    text: "Coordinate accepted requests, pre-visit confirmation, travel, and care completion.",
    icon: Home,
  },
  {
    title: "Follow-up support",
    text: "Keep consultations, care plans, and on-the-ground updates connected.",
    icon: HeartPulse,
  },
];

export const heroStats = [
  { value: "Doctors", label: "general consultations" },
  { value: "Home Care", label: "nurse visits" },
  { value: "Secure", label: "records and chat" },
];

export const howItWorksSteps = [
  {
    id: "01",
    title: "Create your patient account",
    text: "Start with your details and begin a guided patient onboarding flow built around trust.",
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
  { label: "Home Care", href: "#how-it-works" },
];
