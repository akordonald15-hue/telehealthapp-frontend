import {
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  HeartPulse,
  LockKeyhole,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRoundCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const navItems = ["Home", "Features", "Doctors", "How It Works", "Contact"];

const trustItems = [
  { label: "Secure consultations", icon: LockKeyhole },
  { label: "Verified doctors", icon: UserRoundCheck },
  { label: "Patient-centered care", icon: HeartPulse },
  { label: "Protected health records", icon: ShieldCheck },
];

const doctors = [
  {
    name: "Dr. Amara Okafor",
    specialty: "Family Medicine",
    qualification: "MBBS, FWACP",
    experience: "11 years",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=700&q=80",
    bio: "Primary care support for everyday health concerns, prevention, and follow-up care.",
  },
  {
    name: "Dr. Tunde Adebayo",
    specialty: "Internal Medicine",
    qualification: "MBBS, MSc Clinical Medicine",
    experience: "9 years",
    image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=700&q=80",
    bio: "Care for adults managing chronic symptoms, medication questions, and referrals.",
  },
  {
    name: "Dr. Nneka Eze",
    specialty: "Pediatrics",
    qualification: "MBBS, DCH",
    experience: "8 years",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=700&q=80",
    bio: "Friendly support for children, family guidance, and early symptom review.",
  },
  {
    name: "Dr. Chinedu Musa",
    specialty: "General Practice",
    qualification: "MBBS",
    experience: "7 years",
    image: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=700&q=80",
    bio: "Practical care for urgent questions, wellness checks, and next-step planning.",
  },
];

const steps = [
  "Create your secure account",
  "Choose a trusted doctor",
  "Book a consultation",
  "Get care, records, and follow-up",
];

const features = [
  { title: "Appointments", text: "Book and manage consultations from one place.", icon: CalendarDays },
  { title: "Secure messaging", text: "Continue care conversations with your doctor.", icon: MessageSquare },
  { title: "Medical records", text: "Access protected notes and file uploads.", icon: FileText },
  { title: "Referrals", text: "Receive referral notes and specialist next steps.", icon: ClipboardList },
  { title: "AI triage", text: "Share symptoms and receive guided care direction.", icon: Sparkles },
  { title: "Payments", text: "Start and track provider-backed payments.", icon: CreditCard },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F9FAFB] text-[#1F2937]">
      <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="LifeFirst home">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#2563EB] text-white">
              <HeartPulse className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight text-[#1F2937]">LifeFirst</span>
              <span className="block text-xs font-medium text-[#6B7280]">Care starts here</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#4B5563] lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <a key={item} href={`#${item.toLowerCase().replaceAll(" ", "-")}`} className="hover:text-[#2563EB]">
                {item}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link href="/login" className="text-sm font-semibold text-[#4B5563] hover:text-[#2563EB]">
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#2563EB] px-5 text-sm font-bold text-white transition hover:bg-[#1D4ED8]"
            >
              Get Started
            </Link>
          </div>

          <details className="relative lg:hidden">
            <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-md border border-[#E5E7EB] bg-white text-[#1F2937]">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </summary>
            <div className="absolute right-0 mt-3 grid w-64 gap-2 rounded-md border border-[#E5E7EB] bg-white p-3 shadow-lg">
              {navItems.map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-[#4B5563] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                >
                  {item}
                </a>
              ))}
              <Link href="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-[#4B5563] hover:bg-[#EFF6FF]">
                Sign in
              </Link>
              <Link
                href="/register"
                className="inline-flex h-11 items-center justify-center rounded-md bg-[#2563EB] px-4 text-sm font-bold text-white"
              >
                Get Started
              </Link>
            </div>
          </details>
        </div>
      </header>

      <section id="home" className="relative min-h-[82vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1800&q=80"
          alt="Doctor supporting a patient through digital healthcare"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#111827]/55" />
        <div className="relative mx-auto flex min-h-[82vh] max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl pt-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-md bg-white/95 px-3 py-2 text-sm font-bold text-[#2563EB]">
              <ShieldCheck className="h-4 w-4" />
              Trusted doctors. Secure care. One place.
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Access quality healthcare faster with LifeFirst.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/90">
              Book doctors, manage appointments, share records, receive referrals, and get guided care support from a
              calm, secure telehealth workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#2563EB] px-6 text-base font-bold text-white transition hover:bg-[#1D4ED8]"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-md border border-white bg-white px-6 text-base font-bold text-[#1F2937] transition hover:bg-[#F9FAFB]"
              >
                Book Appointment
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 text-sm font-semibold text-white/90 sm:grid-cols-3">
              <span>Four launch doctors on standby</span>
              <span>Secure records and messaging</span>
              <span>Mobile-first care access</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[#E5E7EB] bg-white">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 py-6 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 rounded-md border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-4">
                <Icon className="h-5 w-5 text-[#10B981]" />
                <span className="text-sm font-bold text-[#1F2937]">{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section id="doctors" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-[#2563EB]">Meet Our Doctors</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
            Four clinicians ready to support LifeFirst at launch.
          </h2>
          <p className="mt-4 text-base leading-7 text-[#4B5563]">
            These profiles use launch-ready placeholder content so real partner details can be swapped in cleanly.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {doctors.map((doctor) => (
            <article key={doctor.name} className="overflow-hidden rounded-md border border-[#E5E7EB] bg-white shadow-sm">
              <div className="relative aspect-[4/3]">
                <Image src={doctor.image} alt={`${doctor.name}, ${doctor.specialty}`} fill className="object-cover" sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" />
              </div>
              <div className="grid gap-3 p-5">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937]">{doctor.name}</h3>
                  <p className="text-sm font-semibold text-[#2563EB]">{doctor.specialty}</p>
                </div>
                <div className="grid gap-1 text-sm text-[#4B5563]">
                  <span>{doctor.qualification}</span>
                  <span>{doctor.experience} experience</span>
                </div>
                <p className="text-sm leading-6 text-[#4B5563]">{doctor.bio}</p>
                <Link
                  href="/register"
                  className="mt-1 inline-flex h-10 items-center justify-center rounded-md border border-[#2563EB] px-4 text-sm font-bold text-[#2563EB] transition hover:bg-[#EFF6FF]"
                >
                  Book Session
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#10B981]">How It Works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
              A simpler path from concern to care.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step} className="rounded-md border border-[#E5E7EB] bg-[#F9FAFB] p-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#DBEAFE] text-sm font-bold text-[#2563EB]">
                  {index + 1}
                </div>
                <p className="mt-5 text-lg font-bold text-[#1F2937]">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-[#2563EB]">Features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1F2937] sm:text-4xl">
              Connected care tools without the clutter.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#4B5563]">
              LifeFirst brings verified backend workflows into a clean patient and clinician experience.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-md border border-[#E5E7EB] bg-white p-5 shadow-sm">
                  <Icon className="h-6 w-6 text-[#2563EB]" />
                  <h3 className="mt-4 text-lg font-bold text-[#1F2937]">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4B5563]">{feature.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 rounded-md border border-[#E5E7EB] bg-[#EFF6FF] p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#2563EB]">Start today</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#1F2937]">Put your health first with LifeFirst.</h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[#4B5563]">
                Create your account, choose care, and keep your health journey organized from your phone.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-md bg-[#2563EB] px-6 text-base font-bold text-white">
                Get Started
              </Link>
              <Link href="/login" className="inline-flex h-12 items-center justify-center rounded-md border border-[#2563EB] bg-white px-6 text-base font-bold text-[#2563EB]">
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-[#E5E7EB] bg-[#1F2937] text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.2fr_0.8fr_0.8fr] lg:px-8">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#10B981] text-white">
                <Stethoscope className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold">LifeFirst</span>
            </div>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/75">
              Calm, secure telehealth access for patients and care teams.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold">Useful links</h3>
            <div className="mt-4 grid gap-2 text-sm text-white/75">
              <Link href="/login">Sign in</Link>
              <Link href="/register">Create account</Link>
              <a href="#doctors">Doctors</a>
              <a href="#features">Features</a>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold">Contact</h3>
            <div className="mt-4 grid gap-2 text-sm text-white/75">
              <span>hello@lifefirst.example</span>
              <span>Support hours coming soon</span>
              <span>Privacy and terms placeholders</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
