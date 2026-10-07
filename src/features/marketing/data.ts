import { HeartPulse, Home, ShieldCheck, Sparkles, UserRoundCheck, type LucideIcon } from "lucide-react";

export const marketingNavItems = [
  { label: "Home", href: "#home" },
  { label: "Doctors", href: "#doctors" },
  { label: "Home Care", href: "#home-care" },
  { label: "Trust", href: "#trust" },
  { label: "Contact", href: "#contact" },
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

export const faqItems: Array<{ question: string; answer: string[] }> = [
  {
    question: "Is Caretekk more expensive than a regular hospital visit?",
    answer: [
      "Caretekk is priced to be transparent you'll know the cost before you book. Doctor consultations start from ₦2,000, and home care visits start from ₦5,000.",
      "When you factor in transport, parking, and time lost to hospital queues, many families find Caretekk saves them money as well as stress.",
    ],
  },
  {
    question: "How do I know the doctor or nurse is actually qualified?",
    answer: [
      "Every professional on Caretekk whether they consult virtually or visit your home is licensed, credential-verified, and background-checked before they're approved on the platform.",
      "You can see their qualifications before you book and rate every consultation or visit.",
    ],
  },
  {
    question: "What if I need care urgently, not next week?",
    answer: [
      "Virtual doctor consultations are typically confirmed within minutes, anywhere in Nigeria. For in-home nursing or caregiver visits, we offer same-day availability in the cities we currently serve you'll see real-time availability when you book.",
    ],
  },
  {
    question: "Do you only serve Akwa Ibom?",
    answer: [
      "Virtual doctor consultations are available anywhere in Nigeria. In-person homecare and nursing visits are currently available in Akwa Ibom, with more locations coming soon.",
      "Enter your location when you book and we'll confirm what's available near you.",
    ],
  },
  {
    question: "Is my family's information safe with Caretekk?",
    answer: [
      "Yes. Your medical information is kept confidential and secure within the Caretekk platform, and only shared with the doctor or provider handling your consultation or visit.",
    ],
  },
];

export const footerCompanyLinks = [
  { label: "Home", href: "#home" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Why Caretekk", href: "#trust" },
  { label: "Contact Us", href: "#contact" },
];

export const footerServiceLinks = [
  { label: "Talk to a Doctor", href: "/register" },
  { label: "Home Nursing", href: "#home-care" },
  { label: "Elderly Care", href: "#home-care" },
  { label: "Mother & Baby Care", href: "#home-care" },
];
