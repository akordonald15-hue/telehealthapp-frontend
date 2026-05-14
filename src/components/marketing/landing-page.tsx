import Image from "next/image";
import Link from "next/link";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { DoctorCard } from "@/components/marketing/doctor-card";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { doctors, footerLinks, heroStats, howItWorksSteps, trustItems } from "@/features/marketing/data";
import { BRAND_SUPPORT_EMAIL } from "@/lib/brand";

export function LandingPage() {
  return (
    <main id="home" className="min-h-screen bg-[var(--background)] text-[#1F2937]">
      <MarketingHeader />

      <section className="relative overflow-hidden pb-10 pt-10 sm:pb-14 sm:pt-14 lg:pb-18 lg:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(124,164,215,0.22),transparent_30%),radial-gradient(circle_at_85%_10%,rgba(66,107,179,0.12),transparent_26%),linear-gradient(180deg,#F8FBFF_0%,#F3F7FC_48%,#F7FAFE_100%)]" />
        <div className="lf-shell relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)]">
          <div className="animate-fade-up">
            <p className="ct-caption text-[var(--primary)]">Trusted digital healthcare</p>
            <h1 className="ct-hero-title mt-5 max-w-[11ch] text-[#162033]">
              Care that feels close, clear, and trusted.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[#5E6B82]">
              Caretekk brings together general medicine, mother and baby care, elderly care, and homecare support in one premium healthcare workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/register" className="lf-btn lf-btn-primary sm:w-auto">
                Book consultation
              </Link>
              <a href="#demo" className="lf-btn lf-btn-secondary sm:w-auto">
                See Caretekk in action
              </a>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="lf-panel rounded-[20px] p-4">
                  <strong className="block font-heading text-lg font-semibold text-[#162033]">{stat.value}</strong>
                  <span className="mt-2 block text-sm leading-6 text-[#667085]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up-delayed">
            <div className="relative overflow-hidden rounded-[32px] border border-white/80 bg-white p-3 shadow-[0_32px_88px_-50px_rgba(15,23,42,0.38)] sm:p-4">
              <Image
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=85"
                alt="Doctor reviewing care details with a patient"
                width={1400}
                height={960}
                unoptimized
                className="h-[380px] w-full rounded-[24px] object-cover sm:h-[520px] lg:h-[620px]"
              />
              <div className="absolute left-6 right-6 top-6 rounded-[20px] border border-white/80 bg-white/90 p-4 shadow-[0_14px_40px_-28px_rgba(15,23,42,0.24)] backdrop-blur-xl sm:right-auto sm:max-w-[320px]">
                <p className="ct-caption text-[var(--primary)]">Verified care team</p>
                <p className="mt-2 font-heading text-xl font-semibold text-[#162033]">Doctors, nurses, and follow-up in one calm flow.</p>
              </div>
              <div className="absolute bottom-6 left-6 right-6 rounded-[20px] border border-white/80 bg-[#162033]/84 p-4 text-white shadow-[0_16px_42px_-30px_rgba(15,23,42,0.4)] backdrop-blur-xl sm:left-auto sm:max-w-[330px]">
                <BrandLockup wordmark="image" inverse wordmarkClassName="h-6 max-w-[152px]" />
                <p className="mt-4 text-sm leading-7 text-white/84">
                  Message your doctor, review your care plan, and request home support without losing the thread of care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-6 sm:pb-10" id="trust">
        <div className="lf-shell">
          <div className="mb-8 max-w-2xl">
            <p className="ct-caption text-[var(--primary)]">Why people trust Caretekk</p>
            <h2 className="ct-section-title mt-4 text-[#162033]">A modern care experience designed to feel safe and easy.</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {trustItems.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="ct-hover-lift lf-panel rounded-[22px] p-5 hover:shadow-[0_24px_50px_-38px_rgba(15,23,42,0.28)]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="ct-card-title mt-5 text-[#162033]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#667085]">{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="lf-section pt-10" id="doctors">
        <div className="lf-shell">
          <div className="mb-10 flex flex-col gap-4 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-xl">
              <p className="ct-caption text-[var(--primary)]">Doctors</p>
              <h2 className="ct-section-title mt-4 text-[#162033]">Meet the doctors behind Caretekk.</h2>
            </div>
            <Link href="/register" className="lf-btn lf-btn-primary sm:w-auto">
              Book consultation
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.name} doctor={doctor} />
            ))}
          </div>
        </div>
      </section>

      <section className="lf-section pt-0">
        <div className="lf-shell">
          <div className="rounded-[32px] bg-[linear-gradient(135deg,#2F579F_0%,#426BB3_58%,#7CA4D7_100%)] p-7 text-white shadow-[0_28px_72px_-44px_rgba(47,87,159,0.52)] sm:p-9 lg:p-10">
            <p className="ct-caption text-white/76">Doctor consultations</p>
            <h2 className="ct-section-title mt-4 max-w-[16ch] text-white">See a doctor for just ₦1,000.</h2>
            <p className="mt-4 max-w-[560px] text-base leading-8 text-white/84">
              Book a session with a trusted doctor from the comfort of your home.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="lf-btn bg-white text-[var(--primary-strong)] shadow-[0_14px_34px_rgba(255,255,255,0.2)] hover:bg-[#F8FBFF] sm:w-auto">
                Book consultation
              </Link>
              <a
                href={`mailto:${BRAND_SUPPORT_EMAIL}?subject=Caretekk%20Demo%20Request`}
                className="lf-btn lf-btn-ghost-light sm:w-auto"
                id="demo"
              >
                Book a demo
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="lf-section bg-[linear-gradient(180deg,#FFFFFF_0%,#F5F9FF_100%)] pt-0" id="home-care">
        <div className="lf-shell grid items-center gap-8 lg:grid-cols-[minmax(320px,0.96fr)_minmax(0,1.04fr)]">
          <div className="overflow-hidden rounded-[30px] border border-white/80 bg-white shadow-[0_26px_64px_-44px_rgba(15,23,42,0.28)]">
            <Image
              src="/img/Nurses.png"
              alt="Trusted home-care nurse supporting a patient"
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="ct-caption text-[var(--primary)]">Homecare support</p>
            <h2 className="ct-section-title mt-4 text-[#162033]">Care at home for recovery, routine support, and family needs.</h2>
            <p className="mt-5 text-base leading-8 text-[#5E6B82]">
              Caretekk connects you with trusted home-care nurses for mother and baby care, elderly care, postnatal support, and general homecare follow-up.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium text-[#475467]">
              <span className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-[var(--primary)]">Mother & baby care</span>
              <span className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-[var(--primary)]">Elderly care</span>
              <span className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-[var(--primary)]">Postnatal care</span>
              <span className="rounded-full bg-[var(--primary-soft)] px-4 py-2 text-[var(--primary)]">General homecare</span>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="lf-btn lf-btn-primary sm:w-auto">
                Book a nurse
              </Link>
              <Link href="/login" className="lf-btn lf-btn-secondary sm:w-auto">
                Request home care
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="lf-section bg-[linear-gradient(180deg,rgba(237,243,255,0.72),rgba(247,250,254,0.9))]" id="how-it-works">
        <div className="lf-shell grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
          <div>
            <p className="ct-caption text-[var(--primary)]">How it works</p>
            <h2 className="ct-section-title mt-4 text-[#162033]">A simple path from sign-up to care.</h2>
            <p className="mt-5 text-base leading-8 text-[#667085]">Caretekk keeps the care journey clear so patients always know the next step.</p>
          </div>
          <div className="grid gap-4">
            {howItWorksSteps.map((step) => (
              <div
                key={step.id}
                className="ct-hover-lift lf-panel rounded-[24px] p-5 hover:shadow-[0_24px_52px_-40px_rgba(15,23,42,0.24)] sm:grid sm:grid-cols-[auto_1fr] sm:gap-5 sm:p-6"
              >
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,var(--primary-strong),var(--primary),var(--accent))] font-heading text-base font-semibold text-white sm:mb-0">
                  {step.id}
                </span>
                <div>
                  <h3 className="ct-card-title text-[#162033]">{step.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[#667085]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-0 pb-16 pt-4 sm:pb-20 sm:pt-8">
        <div className="lf-shell">
          <div className="overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_82%_12%,rgba(124,164,215,0.38),transparent_30%),linear-gradient(135deg,#163055_0%,#2F579F_54%,#426BB3_100%)] px-6 py-9 text-white shadow-[0_28px_72px_-44px_rgba(15,23,42,0.46)] sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:px-14 lg:py-16">
            <div>
              <div className="mb-4">
                <BrandLockup wordmark="image" inverse />
              </div>
              <p className="ct-caption text-white/76">Start today</p>
              <h2 className="ct-section-title mt-4 text-white">Healthcare that feels modern, trusted, and close to home.</h2>
              <p className="mt-4 max-w-[620px] text-base leading-8 text-white/84">
                Book trusted care, keep records close, and move from symptoms to follow-up without confusion.
              </p>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
              <Link href="/register" className="lf-btn bg-white text-[var(--primary-strong)] shadow-[0_16px_34px_rgba(255,255,255,0.18)] hover:bg-[#F8FBFF] sm:w-auto">
                Create account
              </Link>
              <Link href="/login" className="lf-btn lf-btn-ghost-light sm:w-auto">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] bg-white py-12 sm:py-14" id="contact">
        <div className="lf-shell grid gap-8 md:grid-cols-[1.4fr_0.7fr_0.8fr]">
          <div>
            <BrandLockup href="/" />
            <p className="mt-4 max-w-[420px] text-[#667085]">
              Trusted digital healthcare for doctor consultations, homecare support, records, and follow-up care.
            </p>
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-[#162033]">Product</h3>
            <div className="mt-4 grid gap-2">
              {footerLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-sm font-medium text-[#667085] transition hover:text-[var(--primary)]">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-heading text-sm font-semibold text-[#162033]">Support</h3>
            <div className="mt-4 grid gap-2 text-sm font-medium text-[#667085]">
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
