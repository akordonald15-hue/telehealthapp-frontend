import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { DoctorCard } from "@/components/marketing/doctor-card";
import { FeatureCard } from "@/components/marketing/feature-card";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { doctors, features, footerLinks, heroStats, howItWorksSteps, trustItems } from "@/features/marketing/data";
import { BRAND_SUPPORT_EMAIL } from "@/lib/brand";

const outcomePoints = [
  "Consult verified doctors from anywhere",
  "Book trusted home-care nurses in a few steps",
  "Keep messages, records, and follow-up in one place",
];

const proofItems = [
  { title: "Protected access", value: "Verified sign-in and secure records" },
  { title: "Guided flow", value: "Triage, consultation, and care plan in one journey" },
  { title: "Home support", value: "Nurse visits with live trip and care updates" },
];

export function LandingPage() {
  return (
    <main id="home" className="min-h-screen bg-[var(--background)] text-[#1F2937]">
      <MarketingHeader />

      <section className="relative overflow-hidden pb-18 pt-10 sm:pb-22 sm:pt-14 lg:pb-28 lg:pt-18">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(112,152,212,0.24),transparent_26%),radial-gradient(circle_at_88%_10%,rgba(34,164,138,0.12),transparent_24%),linear-gradient(180deg,#f8fbff_0%,#eff4ff_48%,#f6f9ff_100%)]" />
        <div className="lf-shell relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:gap-14">
          <div className="animate-fade-up">
            <div className="ct-glass inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.78rem] font-semibold text-[var(--muted-strong)]">
              <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
              Healthcare that stays calm, connected, and easy to trust
            </div>

            <div className="mt-6 max-w-[760px]">
              <p className="ct-kicker">Caretekk V2</p>
              <h1 className="ct-hero-title mt-4">
                A clearer way to book care, message your doctor, and manage home support.
              </h1>
              <p className="ct-body-lg mt-6 max-w-[640px]">
                Caretekk brings consultations, nurse visits, records, care plans, and secure follow-up into one premium healthcare workspace.
              </p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/register" className="lf-btn lf-btn-primary sm:min-w-[180px]">
                Get started
              </Link>
              <Link href="/login" className="lf-btn lf-btn-secondary sm:min-w-[160px]">
                Sign in
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="ct-soft-card rounded-[22px] p-5">
                  <strong className="block text-lg font-semibold tracking-[-0.03em] text-[#1F2937]">{stat.value}</strong>
                  <span className="mt-2 block text-sm leading-6 text-[#667085]">{stat.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {outcomePoints.map((point) => (
                <div key={point} className="flex items-center gap-3 text-sm font-medium text-[#475467]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  {point}
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up-delayed">
            <div className="ct-panel overflow-hidden rounded-[34px] p-3 sm:p-4">
              <div className="relative overflow-hidden rounded-[28px] bg-[#dfe9fb]">
                <Image
                  src="https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=85"
                  alt="Caretekk doctor reviewing care details with a patient"
                  width={1400}
                  height={980}
                  unoptimized
                  className="h-[380px] w-full object-cover sm:h-[460px] lg:h-[560px]"
                />
                <div className="absolute inset-x-4 top-4 flex flex-col gap-3 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[290px]">
                  <div className="ct-glass rounded-[22px] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">Today</p>
                    <p className="mt-2 text-sm font-semibold text-[#1F2937]">Verified doctors and nurses available</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Move from care check-in to consultation without leaving the same workspace.</p>
                  </div>
                </div>

                <div className="absolute inset-x-4 bottom-4 sm:bottom-5">
                  <div className="ct-glass rounded-[24px] p-4 sm:p-5">
                    <div className="flex items-center gap-3">
                      <BrandLockup wordmark="image" className="gap-2" logoClassName="rounded-[14px] bg-white p-1" wordmarkClassName="h-5 max-w-[140px]" />
                      <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                        Connected care
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {proofItems.map((item) => (
                        <div key={item.title} className="rounded-[18px] border border-white/70 bg-white/78 px-4 py-3">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{item.title}</p>
                          <p className="mt-2 text-sm font-medium leading-6 text-[#1F2937]">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-10">
        <div className="lf-shell grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="ct-soft-card rounded-[24px] p-5 sm:p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[0_18px_28px_-24px_rgba(66,107,179,0.45)]">
                  <Icon className="h-5 w-5" />
                </span>
                <strong className="mt-5 block text-[1rem] font-semibold text-[#1F2937]">{item.title}</strong>
                <p className="mt-2 text-sm leading-6 text-[#667085]">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="lf-section pt-8" id="doctors">
        <div className="lf-shell">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="ct-kicker">Doctors</p>
            <h2 className="ct-section-title mt-4">Meet the doctors available through Caretekk.</h2>
            <p className="ct-body mt-5">
              Clear specialties, trusted profiles, and a calmer way to choose the right doctor for the next step in care.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.name} doctor={doctor} />
            ))}
          </div>
        </div>
      </section>

      <section className="lf-section pt-2">
        <div className="lf-shell grid gap-6 xl:grid-cols-[minmax(0,1.04fr)_minmax(340px,0.96fr)]">
          <div className="overflow-hidden rounded-[34px] bg-[linear-gradient(145deg,#17376E_0%,#426BB3_58%,#6C93CE_100%)] p-7 text-white shadow-[0_34px_90px_-48px_rgba(66,107,179,0.55)] sm:p-9">
            <p className="ct-kicker text-white/78">Doctor consultations</p>
            <h2 className="mt-4 font-heading text-[clamp(2rem,4vw,3.35rem)] font-semibold tracking-[-0.055em]">
              Consult a doctor from home for just N1,000.
            </h2>
            <p className="mt-4 max-w-[620px] text-[1rem] leading-8 text-white/86 sm:text-[1.05rem]">
              Get medical guidance, follow-up support, and referrals when needed without leaving home.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="lf-btn bg-white text-[var(--primary)] shadow-[0_18px_30px_rgba(255,255,255,0.15)] hover:bg-[#F7FAFF]">
                Consult a doctor
              </Link>
              <Link href="/login" className="lf-btn lf-btn-ghost-light">
                Book consultation
              </Link>
            </div>
          </div>

          <div className="ct-panel grid content-center gap-4 p-6 sm:p-8">
            <div className="rounded-[22px] border border-[rgba(216,227,242,0.92)] bg-[var(--surface-soft)] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">What you get</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">A trusted entry point into consultation, follow-up messaging, and care-plan guidance.</p>
            </div>
            <div className="rounded-[22px] border border-[rgba(216,227,242,0.92)] bg-white p-5">
              <p className="text-4xl font-semibold tracking-[-0.05em] text-[#1F2937]">N1,000</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">A simple first step for patients who need medical guidance quickly and clearly.</p>
            </div>
            <div className="rounded-[22px] border border-[rgba(216,227,242,0.92)] bg-white p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--primary)]">After the visit</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">Messages, records, and care plans stay together so follow-up never feels scattered.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="lf-section bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F8FF_100%)] pt-4" id="home-care">
        <div className="lf-shell grid items-center gap-8 lg:grid-cols-[minmax(320px,0.96fr)_minmax(0,1.04fr)]">
          <div className="ct-panel overflow-hidden rounded-[34px] p-3 sm:p-4">
            <Image
              src="/img/Nurses.png"
              alt="Trusted home-care nurse supporting a patient"
              width={1200}
              height={900}
              className="h-full w-full rounded-[28px] object-cover"
            />
          </div>
          <div className="animate-soft-enter">
            <p className="ct-kicker">Home care</p>
            <h2 className="ct-section-title mt-4">Bring trusted nursing support home.</h2>
            <p className="ct-body mt-5 max-w-[620px]">
              Caretekk helps families book mother and baby care, elderly support, postnatal care, and routine home health assistance with clearer updates from request to arrival.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {["Mother and baby care", "Elderly care", "Postnatal care", "Routine home support"].map((item) => (
                <span key={item} className="rounded-full border border-[rgba(216,227,242,0.92)] bg-white px-4 py-2 text-sm font-semibold text-[#475467] shadow-[0_12px_28px_-24px_rgba(20,36,68,0.25)]">
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="lf-btn lf-btn-primary">
                Book a nurse
              </Link>
              <Link href="/login" className="lf-btn lf-btn-secondary">
                Request home care
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="lf-section pt-4" id="how-it-works">
        <div className="lf-shell grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
          <div>
            <p className="ct-kicker">How it works</p>
            <h2 className="ct-section-title mt-4">From onboarding to follow-up, each step stays easy to understand.</h2>
            <p className="ct-body mt-5">
              Caretekk keeps the journey guided, so patients know what to do next and care teams stay aligned.
            </p>
          </div>
          <div className="grid gap-4">
            {howItWorksSteps.map((step) => (
              <div
                key={step.id}
                className="ct-card grid gap-4 rounded-[26px] p-5 sm:grid-cols-[auto_1fr] sm:p-6"
              >
                <span className="grid h-[56px] w-[56px] place-items-center rounded-[18px] bg-[linear-gradient(135deg,var(--primary-strong),var(--primary),var(--accent))] text-lg font-semibold text-white">
                  {step.id}
                </span>
                <div>
                  <h3 className="ct-card-title text-[#1F2937]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#667085]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lf-section pt-0" id="features">
        <div className="lf-shell">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="ct-kicker">Platform capabilities</p>
            <h2 className="ct-section-title mt-4">Everything needed to keep care moving in one place.</h2>
            <p className="ct-body mt-5">
              Patients, doctors, and nurses all work from the same connected product experience.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16 pt-6 sm:pb-20" id="get-started">
        <div className="lf-shell">
          <div className="overflow-hidden rounded-[34px] bg-[radial-gradient(circle_at_82%_14%,rgba(112,152,212,0.4),transparent_30%),linear-gradient(135deg,#17376E_0%,#355A9E_50%,#22A48A_120%)] px-6 py-8 text-white shadow-[0_34px_90px_-48px_rgba(66,107,179,0.5)] sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div>
                <BrandLockup wordmark="image" inverse />
                <p className="ct-kicker mt-6 text-white/78">Start today</p>
                <h2 className="mt-4 font-heading text-[clamp(2rem,4vw,3.45rem)] font-semibold tracking-[-0.055em] text-white">
                  Caretekk makes trusted care feel beautifully simple.
                </h2>
                <p className="mt-4 max-w-[680px] text-[1rem] leading-8 text-white/86 sm:text-[1.05rem]">
                  Book care, keep your records close, and move from symptoms to follow-up without losing momentum.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
                <Link href="/register" className="lf-btn bg-white text-[var(--primary)] shadow-[0_18px_30px_rgba(255,255,255,0.14)] hover:bg-[#F7FAFF]">
                  Create patient account
                </Link>
                <Link href="/login" className="lf-btn lf-btn-ghost-light">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-white py-12 sm:py-14" id="contact">
        <div className="lf-shell grid gap-8 md:grid-cols-[1.3fr_0.7fr_0.8fr]">
          <div>
            <BrandLockup href="/" />
            <p className="mt-4 max-w-[420px] text-sm leading-7 text-[#667085]">
              Trusted digital healthcare access for patients, doctors, home-care teams, and follow-up support.
            </p>
          </div>
          <div>
            <h3 className="ct-card-title text-[#1F2937]">Explore</h3>
            <div className="mt-4 grid gap-2">
              {footerLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-sm font-semibold text-[#667085] transition hover:text-[var(--primary)]">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="ct-card-title text-[#1F2937]">Support</h3>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-[#667085]">
              <a href={`mailto:${BRAND_SUPPORT_EMAIL}`} className="transition hover:text-[var(--primary)]">
                {BRAND_SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
