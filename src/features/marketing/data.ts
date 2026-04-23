import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  HeartPulse,
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
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "#contact" },
];

export const trustItems: Array<{ title: string; text: string; icon: LucideIcon }> = [
  {
    title: "Secure consultations",
    text: "Protected care conversations and account access.",
    icon: ShieldCheck,
  },
  {
    title: "Verified doctors",
    text: "Trusted clinicians prepared for launch support.",
    icon: UserRoundCheck,
  },
  {
    title: "Protected records",
    text: "Medical files and referrals stay organized.",
    icon: FileText,
  },
  {
    title: "Patient-centered care",
    text: "Clear next steps before and after each visit.",
    icon: HeartPulse,
  },
];

export const doctors = [
  {
    name: "Dr. Amara Okafor",
    specialty: "Family Medicine",
    qualification: "MBBS, FWACP",
    experience: "11 years experience",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=900&q=85",
    bio: "Primary care support for everyday concerns, prevention, and ongoing follow-up.",
  },
  {
    name: "Dr. Tunde Adebayo",
    specialty: "Internal Medicine",
    qualification: "MBBS, MSc Clinical Medicine",
    experience: "9 years experience",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=900&q=85",
    bio: "Care for adults managing chronic symptoms, medication questions, and referrals.",
  },
  {
    name: "Dr. Nneka Eze",
    specialty: "Pediatrics",
    qualification: "MBBS, DCH",
    experience: "8 years experience",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=900&q=85",
    bio: "Friendly support for children, family guidance, and early symptom review.",
  },
  {
    name: "Dr. Chinedu Musa",
    specialty: "General Practice",
    qualification: "MBBS",
    experience: "7 years experience",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=900&q=85",
    bio: "Practical care for urgent questions, wellness checks, and next-step planning.",
  },
];

export const features: Array<{ title: string; text: string; icon: LucideIcon }> = [
  {
    title: "Appointments",
    text: "Book and manage consultations with clear status updates.",
    icon: CalendarDays,
  },
  {
    title: "Secure messaging",
    text: "Continue care conversations with doctors after a visit.",
    icon: MessageSquare,
  },
  {
    title: "Medical records",
    text: "Keep notes and file uploads organized around each patient.",
    icon: FileText,
  },
  {
    title: "Care plans",
    text: "Review doctor notes, specialist follow-up, and next steps in one place.",
    icon: ClipboardList,
  },
  {
    title: "Care check-in",
    text: "Share symptoms and receive guided care direction.",
    icon: Sparkles,
  },
  {
    title: "Payments",
    text: "Start and track provider-backed payments with confidence.",
    icon: CreditCard,
  },
];

export const heroStats = [
  { value: "4", label: "launch doctors" },
  { value: "24/7", label: "care access path" },
  { value: "Secure", label: "records and chat" },
];

export const howItWorksSteps = [
  {
    id: "01",
    title: "Create your account",
    text: "Start with your details and begin a guided onboarding flow built around trust.",
  },
  {
    id: "02",
    title: "Confirm your email",
    text: "Verify your account before you move into sign-in and your first care check-in.",
  },
  {
    id: "03",
    title: "Complete your care check-in",
    text: "Share symptoms first so we can guide you toward the right doctor and the right next step.",
  },
  {
    id: "04",
    title: "Continue with care",
    text: "Move into consultation, appointments, records, care plans, and follow-up in one place.",
  },
];

export const footerLinks = [
  { label: "Features", href: "#features" },
  { label: "Doctors", href: "#doctors" },
  { label: "How It Works", href: "#how-it-works" },
];
