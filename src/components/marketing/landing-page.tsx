import Image from "next/image";
import Link from "next/link";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { DoctorCard } from "@/components/marketing/doctor-card";
import { FeatureCard } from "@/components/marketing/feature-card";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { doctors, features, footerLinks, heroStats, howItWorksSteps, trustItems } from "@/features/marketing/data";
import { BRAND_SUPPORT_EMAIL } from "@/lib/brand";

export function LandingPage() {
  return (
    <main id="home" className="min-h-screen bg-[var(--background)] text-[#1F2937]">
      <MarketingHeader />

      <section className="relative overflow-hidden pb-12 pt-12 sm:pt-16 lg:pt-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_22%,rgba(112,152,212,0.28),transparent_32%),radial-gradient(circle_at_80%_8%,rgba(34,164,138,0.14),transparent_28%),linear-gradient(135deg,#f8fbff_0%,#edf3ff_48%,#f7fafe_100%)]" />
        <div className="lf-shell relative grid items-center gap-10 sm:gap-12 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:gap-14">
          <div className="min-w-0 animate-fade-up">
            <p className="mb-4 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[var(--primary)]">Connected care, built around trust</p>
            <h1 className="w-full max-w-full break-words font-heading text-[2.35rem] font-extrabold leading-[1.04] tracking-[-0.045em] text-[#1F2937] sm:max-w-[730px] sm:text-[clamp(3rem,7vw,5.8rem)] sm:leading-[1.02] sm:tracking-[-0.055em]">
              Trusted doctors and home-care nurses from one Caretekk workspace.
            </h1>
            <p className="mt-5 w-full max-w-full break-words text-base leading-[1.82] text-[#475467] sm:max-w-[650px] sm:text-[clamp(1rem,2.4vw,1.22rem)]">
              Caretekk connects you with trusted doctors and home-care nurses for general medical consultation, mother and baby care, elderly care, postnatal support, and safe healthcare guidance from home.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link href="/register" className="lf-btn lf-btn-primary sm:min-w-[174px]">
                Get started as a patient
              </Link>
              <Link href="/login" className="lf-btn lf-btn-secondary sm:min-w-[160px]">
                Sign in
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[18px] border border-[rgba(220,230,245,0.82)] bg-white/80 p-[18px] shadow-[0_16px_40px_rgba(31,41,55,0.06)] backdrop-blur-xl"
                >
                  <strong className="block text-xl font-black text-[#1F2937]">{stat.value}</strong>
                  <span className="block text-[0.84rem] font-bold text-[#667085]">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="animate-fade-up-delayed">
            <div className="relative min-h-[390px] overflow-hidden rounded-[28px] border-[7px] border-white bg-white shadow-[0_24px_60px_rgba(66,107,179,0.16)] sm:min-h-[520px] sm:rounded-[36px] sm:border-[10px] lg:min-h-[640px]">
              <Image
                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=85"
                alt="Doctor reviewing health information with a patient"
                width={1200}
                height={640}
                unoptimized
                className="h-full min-h-[390px] w-full object-cover sm:min-h-[520px] lg:min-h-[640px]"
              />
              <div className="absolute left-4 right-4 top-4 flex max-w-full items-center gap-3 rounded-[18px] border border-[rgba(220,230,245,0.86)] bg-white/92 p-4 shadow-[0_10px_30px_rgba(31,41,55,0.08)] backdrop-blur-xl sm:left-auto sm:right-6 sm:top-7 sm:max-w-[310px]">
                <span className="h-[14px] w-[14px] rounded-full bg-[var(--secondary)] shadow-[0_0_0_8px_rgba(34,164,138,0.14)]" />
                <div>
                  <strong className="block text-[0.94rem] font-bold text-[#1F2937]">Doctor available</strong>
                  <p className="text-[0.82rem] font-semibold text-[#667085]">Consultation slots open today</p>
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-[18px] border border-[rgba(220,230,245,0.86)] bg-white/92 p-4 shadow-[0_10px_30px_rgba(31,41,55,0.08)] backdrop-blur-xl sm:left-7 sm:right-auto sm:max-w-[330px]">
                <Image
                  src="/Logo/Logo.png"
                  alt="Caretekk brand mark"
                  width={46}
                  height={46}
                  className="h-[46px] w-[46px] rounded-[14px] bg-white object-contain p-1.5"
                />
                <div>
                  <strong className="block text-[0.94rem] font-bold text-[#1F2937]">Care that follows through</strong>
                  <p className="text-[0.82rem] font-semibold text-[#667085]">Records, referrals, and home support in one place</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-[3] -mt-2 pb-6 sm:-mt-6">
        <div className="lf-shell grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex gap-4 rounded-[14px] border border-[rgba(220,230,245,0.84)] bg-white/95 p-5 shadow-[0_10px_30px_rgba(31,41,55,0.08)] sm:p-6"
              >
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[14px] bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <strong className="block font-black text-[#1F2937]">{item.title}</strong>
                  <p className="mt-1 text-sm text-[#667085]">{item.text}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="lf-section" id="doctors">
        <div className="lf-shell">
          <div className="mx-auto mb-10 max-w-[740px] text-center sm:mb-12">
            <p className="mb-4 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[var(--primary)]">Meet Our Doctors</p>
            <h2 className="font-heading text-[clamp(2rem,4vw,3.45rem)] font-extrabold tracking-[-0.055em] text-[#1F2937]">
              Our doctors
            </h2>
            <p className="mt-5 text-[1.04rem] text-[#667085]">
              Choose care with a simple view of the doctors available through Caretekk.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.name} doctor={doctor} />
            ))}
          </div>
        </div>
      </section>

      <section className="lf-section bg-[linear-gradient(180deg,rgba(237,243,255,0.85),rgba(247,250,254,0.92))]" id="how-it-works">
        <div className="lf-shell grid items-start gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-14">
          <div>
            <p className="mb-4 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[var(--primary)]">How It Works</p>
            <h2 className="font-heading text-[clamp(2rem,4vw,3.45rem)] font-extrabold tracking-[-0.055em] text-[#1F2937]">
              Simple steps from account creation to care at home or online.
            </h2>
            <p className="mt-5 text-[1.04rem] text-[#667085]">
              Caretekk keeps the care journey clear so patients always know what happens next.
            </p>
          </div>
          <div className="grid gap-4">
            {howItWorksSteps.map((step) => (
              <div
                key={step.id}
                className="grid gap-4 rounded-[22px] border border-[rgba(220,230,245,0.9)] bg-white/90 p-5 shadow-[0_10px_30px_rgba(31,41,55,0.08)] transition duration-200 hover:-translate-y-1.5 hover:border-[rgba(66,107,179,0.22)] hover:shadow-[0_28px_70px_rgba(31,41,55,0.12)] sm:grid-cols-[auto_1fr] sm:p-6"
              >
                <span className="grid h-[54px] w-[54px] place-items-center rounded-[18px] bg-[linear-gradient(135deg,var(--primary-strong),var(--primary),var(--accent))] font-black text-white">
                  {step.id}
                </span>
                <div>
                  <h3 className="font-heading text-[1.15rem] font-extrabold tracking-[-0.035em] text-[#1F2937]">{step.title}</h3>
                  <p className="mt-2 text-[#667085]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lf-section" id="features">
        <div className="lf-shell">
          <div className="mx-auto mb-12 max-w-[740px] text-center">
            <p className="mb-4 text-[0.78rem] font-black uppercase tracking-[0.12em] text-[var(--primary)]">Platform Capabilities</p>
            <h2 className="font-heading text-[clamp(2rem,4vw,3.45rem)] font-extrabold tracking-[-0.055em] text-[#1F2937]">
              Everything patients, care teams, and nurses need to keep care moving.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="px-0 pb-16 pt-6 sm:pb-20 sm:pt-10" id="get-started">
        <div className="lf-shell">
          <div className="grid gap-8 overflow-hidden rounded-[32px] bg-[radial-gradient(circle_at_82%_12%,rgba(112,152,212,0.52),transparent_34%),linear-gradient(135deg,#355a9e_0%,#426bb3_52%,#22a48a_120%)] px-5 py-8 text-white shadow-[0_24px_60px_rgba(66,107,179,0.18)] sm:px-10 sm:py-12 lg:grid-cols-[1fr_auto] lg:items-center lg:px-14 lg:py-16">
            <div>
              <div className="mb-4">
                <BrandLockup wordmark="image" inverse />
              </div>
              <p className="mb-4 text-[0.78rem] font-black uppercase tracking-[0.12em] text-white/80">Start Today</p>
              <h2 className="font-heading text-[clamp(2rem,4vw,3.45rem)] font-extrabold tracking-[-0.055em] text-white">
                Put your health first with Caretekk.
              </h2>
              <p className="mt-4 max-w-[650px] text-[1.05rem] text-white/85">
                Book trusted care, keep your records close, and move from symptoms to follow-up without confusion.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-stretch">
              <Link href="/register" className="lf-btn bg-white text-[var(--primary)] shadow-[0_16px_34px_rgba(255,255,255,0.18)] hover:-translate-y-0.5 hover:bg-[#F8FBFF]">
                Create patient account
              </Link>
              <Link href="/login" className="lf-btn lf-btn-ghost-light">
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
              Trusted digital healthcare access for patients, doctors, home care teams, and follow-up support.
            </p>
          </div>
          <div>
            <h3 className="font-heading text-[0.95rem] font-extrabold tracking-[-0.03em] text-[#1F2937]">Product</h3>
            <div className="mt-4 grid gap-2">
              {footerLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-sm font-bold text-[#667085] transition hover:text-[var(--primary)]">
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-heading text-[0.95rem] font-extrabold tracking-[-0.03em] text-[#1F2937]">Support</h3>
            <div className="mt-4 grid gap-2 text-sm font-bold text-[#667085]">
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
