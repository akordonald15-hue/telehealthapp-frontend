export const marketingNavItems = [
  { label: "Home", href: "#home" },
  { label: "Doctors", href: "#doctors" },
  { label: "Home Care", href: "#home-care" },
  { label: "Trust", href: "#trust" },
  { label: "Contact", href: "#contact" },
];

export const trustCards: Array<{ title: string; text: string }> = [
  {
    title: "Vetted Professionals",
    text: "Licensed, credential-checked, and interviewed before joining Caretekk.",
  },
  {
    title: "Safety First",
    text: "Identity verification and strict clinical protocols on every visit.",
  },
  {
    title: "Fast, Honest Timing",
    text: "Doctors confirm in minutes. Homecare matched same-day where we serve.",
  },
  {
    title: "Real Accountability",
    text: "Every visit is tracked and rated, with a direct line to our team.",
  },
];

export const howItWorksSteps: Array<{ num: string; title: string; text: string; fill: string; image: string }> = [
  {
    num: "01",
    title: "Create your account",
    text: "Start with your email and move through a guided onboarding flow built around trust.",
    fill: "bg-accent-deep",
    image: "/img/how-it-works-1.png",
  },
  {
    num: "02",
    title: "Confirm your email",
    text: "Verify your account with a 6-digit code before you continue into care.",
    fill: "bg-accent-strong",
    image: "/img/how-it-works-2.png",
  },
  {
    num: "03",
    title: "Choose your care path",
    text: "Book a doctor, request a nurse, or start your care check-in with confidence.",
    fill: "bg-primary-strong",
    image: "/img/how-it-works-3.png",
  },
];

export const technologySteps: Array<{ num: string; title: string }> = [
  { num: "01", title: "Book in minutes, from your phone" },
  { num: "02", title: "See your provider's credentials before you confirm" },
  { num: "03", title: "Track homecare visit status and arrival" },
  { num: "04", title: "Keep consultation history and visit notes in one place" },
];

export const getStartedCta = {
  heading:
    "Your family deserves\ncare that doesn't make\nthem wait.",
  body:
    "Whether you need a doctor's opinion right now or\nhands-on care at home, help is closer than you think.\nGet started today.",
  primaryLabel: "Talk to a Doctor",
  secondaryLabel: "Book Homecare",
  primaryHref: "/register",
  secondaryHref: "/login",
};

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

export const footerLinks = [
  { label: "Doctors", href: "#doctors" },
  { label: "Home Care", href: "#home-care" },
  { label: "Trust", href: "#trust" },
];
