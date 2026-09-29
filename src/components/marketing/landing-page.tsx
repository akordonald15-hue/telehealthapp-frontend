import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Facebook,
  HousePlus,
  Linkedin,
  MessageCircle,
  Sparkles,
  Stethoscope,
} from "lucide-react";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.13a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.56Z" />
    </svg>
  );
}

import { BrandLockup } from "@/components/brand/brand-lockup";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { ArrowLongRightIcon } from "@/components/marketing/marketing-icons";
import { doctors, footerLinks, howItWorksSteps, platformHighlights, trustItems } from "@/features/marketing/data";
import { BRAND_NAME, BRAND_SUPPORT_EMAIL } from "@/lib/brand";

const homeCareChips = ["Mother & baby care", "Elderly care", "Postnatal care", "General homecare"];
const stepIcons = [Calendar, Stethoscope, Sparkles, MessageCircle];

export function LandingPage() {
  const [advice, homeVisits, verified, confirmation, pricing] = platformHighlights;

  return (
    <main id="home" className="min-h-screen overflow-x-hidden bg-[#f8f9ff] text-[#0b1c30]">
      {/* Sizes in the two redesigned sections are design px on a 1000px frame; .lp-scale zooms them from lg up. */}
      <div className="@container">
        {/* Hero */}
        <section className="lp-scale bg-white px-[7px] pb-[3px] pt-[7px]">
          <div className="relative overflow-hidden rounded-[18.5px] bg-[linear-gradient(180deg,#2563EB_0%,#3974EE_12%,#3877EF_25%,#4385F3_50%,#5094F5_75%,#60A5FA_100%)] pt-[163.5px] text-center max-lg:px-4 max-lg:pt-[104px]">
            <HeroGridLines />
            <MarketingHeader />

            <div className="relative">
              <div className="inline-flex h-[47.6px] items-center gap-[8px] rounded-[22px] rounded-br-none rounded-tl-[2px] bg-[#4E8FF4] pl-[30.2px] pr-[30px] text-[15.15px] font-medium leading-none text-white max-sm:px-5">
                <span className="h-[10.6px] w-[10.6px] rounded-full bg-[#A6C7FA]" />
                Trusted Digital Healthcare
                <span className="h-[10.6px] w-[10.6px] rounded-full bg-[#A6C7FA]" />
              </div>

              <h1 className="mt-[22.8px] text-[40.25px] font-bold leading-none text-white max-sm:text-[30px] max-sm:leading-[1.15]">
                <span className="flex h-[60.9px] items-center justify-center max-lg:h-auto max-lg:flex-wrap max-lg:gap-y-3">
                  {/* Hairlines run from the card edges to the first headline line */}
                  <span aria-hidden className="h-[0.55px] flex-1 translate-y-[3.35px] bg-white max-lg:hidden" />
                  <span>Talk to a Doctor</span>
                  <span className="ml-[12.5px] inline-flex h-[60.9px] items-center rounded-bl-[18px] rounded-tr-[18px] border-b-[3.2px] border-white bg-[#1E40AF] pl-[10.3px] pr-[16.2px] text-[31.75px] max-sm:h-[48px] max-sm:text-[24px]">
                    Anywhere
                  </span>
                  <span aria-hidden className="h-[0.55px] flex-1 translate-y-[3.35px] bg-white max-lg:hidden" />
                </span>
                <span className="mt-[7.7px] block max-sm:mt-3">Book Home Care Nearby</span>
              </h1>

              <p className="mx-auto mt-[23.9px] max-w-[568px] text-[16.5px] font-light leading-[25.15px] text-[#F7FAFE]">
                Connect with a licensed doctor virtually in minutes, from wherever you are or book a vetted nurse for in-home care in Akwa Ibom. See a doctor from ₦2,000, or book home care from ₦5,000.
              </p>

              <div className="mt-[35.15px] flex justify-center gap-[33.9px] max-sm:flex-col max-sm:gap-4">
                <Link
                  href="/register"
                  className="inline-flex h-[58.8px] w-[249.5px] items-center justify-center gap-[17.6px] rounded-[11.6px] bg-[#1E40AF] text-[18px] font-medium leading-none text-white shadow-[0_14px_30px_-12px_rgba(15,23,42,0.45)] transition hover:-translate-y-0.5 hover:bg-[#1E3A8A] max-sm:w-full"
                >
                  Talk to a Doctor
                  <ArrowLongRightIcon className="h-[17px] w-[23.4px]" />
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-[58.8px] w-[249.5px] items-center justify-center gap-[16.4px] rounded-[11.6px] border border-white text-[18px] font-medium leading-none text-white transition hover:-translate-y-0.5 hover:bg-white/10 max-sm:w-full"
                >
                  Book Homecare
                  <HousePlus className="h-[28px] w-[28px]" strokeWidth={1.7} />
                </Link>
              </div>

              <div className="relative mx-auto mt-[48px] h-[372px] w-[516px] translate-x-[8.2px] max-lg:translate-x-0 max-sm:h-[250px] max-sm:w-full">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-[#BFD8FF]/45 blur-[90px]"
                />
                {/* Placeholder photo. For the transparent team cutout, switch to object-contain object-bottom and drop the rounding. */}
                <div className="relative h-full w-full overflow-hidden rounded-t-[28px]">
                  <Image
                    src="/img/Dr effiong Okon.jpg"
                    alt="Caretekk doctor ready for a consultation"
                    fill
                    priority
                    sizes="(min-width: 1024px) 52vw, 100vw"
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Platform — one platform, two ways to get care */}
        <section id="services" className="lp-scale bg-[#FCFDFF] px-4 pb-24 pt-[53.9px]">
          <h2 className="text-center text-[40.25px] font-bold leading-[48.2px] text-[#0b1c30] max-sm:text-[30px] max-sm:leading-[1.2]">
            One <span className="text-[#3B82F6]">Platform.</span> Two
            <br className="max-sm:hidden" /> Ways to Get Real Care.
          </h2>

          <div className="mx-auto mt-[48.6px] w-[934px] max-w-full space-y-[20.5px]">
            <div className="grid gap-[18.5px] md:grid-cols-[535.8fr_380.5fr]">
              <PlatformCard highlight={advice} className="md:min-h-[290.4px]" />
              <PlatformCard highlight={homeVisits} className="md:min-h-[290.4px]" />
            </div>
            <div className="grid gap-[18.5px] md:grid-cols-[380.5fr_535.8fr]">
              <PlatformCard highlight={verified} className="md:min-h-[290.4px]" titleWidthClassName="max-w-[300px]" />
              <PlatformCard highlight={confirmation} className="md:min-h-[290.4px]" />
            </div>
            {/* Same width as the wide cards above, offset as in the design (not exactly centred) */}
            <div className="md:ml-[22.53%] md:w-[57.37%]">
              <PlatformCard highlight={pricing} className="md:min-h-[248px]" />
            </div>
          </div>
        </section>
      </div>

      <div className="ct-mesh">
        {/* Legacy hero — replaced by the redesigned hero above. To restore, re-add the
            HeroMockup import plus BadgeCheck and PlayCircle from lucide-react. */}
        {/*
        <section className="relative mx-auto max-w-[1440px] overflow-hidden px-4 pb-24 pt-12 sm:pb-32 md:px-10 md:pt-20 lg:pb-40">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="z-10 animate-fade-up text-center lg:text-left">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(116,118,134,0.18)] bg-[#dce9ff] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1e40af]">
                <BadgeCheck className="h-4 w-4" />
                <span>Trusted digital healthcare</span>
              </div>

              <h1 className="font-heading text-[2.5rem] font-semibold leading-[1.04] tracking-[-0.03em] text-[#0b1c30] sm:text-[3rem] lg:text-[3.5rem]">
                Care that feels close, clear, and{" "}
                <span className="italic text-[#2563EB]">trusted</span>.
              </h1>

              <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-[#434655] sm:text-lg lg:mx-0">
                Caretekk brings together general medicine, mother and baby care, elderly care, and homecare support in one premium healthcare workspace.
              </p>

              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center rounded-3xl bg-[#2563EB] px-8 py-4 font-bold text-white shadow-[0_18px_38px_-18px_rgba(29,78,216,0.55)] transition hover:-translate-y-0.5 hover:bg-[#1e40af] hover:shadow-[0_22px_44px_-18px_rgba(29,78,216,0.65)] sm:w-auto"
                >
                  Book consultation
                </Link>
                <a
                  href="#demo"
                  className="ct-glass inline-flex w-full items-center justify-center gap-2 rounded-3xl px-8 py-4 font-semibold text-[#0b1c30] transition hover:bg-[#eff4ff] sm:w-auto"
                >
                  <PlayCircle className="h-5 w-5 text-[#2563EB]" />
                  See Caretekk in action
                </a>
              </div>
            </div>

            <div className="relative flex min-h-[640px] animate-fade-up-delayed items-center justify-center lg:justify-end">
              <div className="absolute -z-10 h-[110%] w-[110%] rounded-full bg-[#2563EB]/8 blur-[120px]" />
              <HeroMockup />
            </div>
          </div>
        </section>
        */}

        {/* Service categories bar — replaced by the platform section above. To restore, re-add
            the heroStats import from "@/features/marketing/data". */}
        {/*
        <section className="border-y border-[rgba(116,118,134,0.12)] bg-white/50 py-10">
          <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-4 text-center md:grid-cols-3 md:gap-0 md:divide-x md:divide-[rgba(116,118,134,0.18)] md:px-10">
            {heroStats.map((stat) => (
              <div key={stat.value} className="px-4">
                <p className="font-heading text-xl font-bold text-[#2563EB] sm:text-2xl">{stat.value}</p>
                <p className="mx-auto mt-3 max-w-[26ch] text-[11px] font-semibold uppercase tracking-[0.16em] text-[#434655]">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>
        */}

        {/* Bento — Trust */}
        <section id="trust" className="mx-auto max-w-[1440px] px-4 py-24 sm:py-28 md:px-10 lg:py-32">
          <div className="mb-16 text-center">
            <p className="ct-caption text-[#2563EB]">Why people trust Caretekk</p>
            <h2 className="mx-auto mt-4 max-w-3xl font-heading text-3xl font-semibold leading-tight text-[#0b1c30] sm:text-4xl">
              A modern care experience designed to feel safe and easy.
            </h2>
          </div>

          <div className="grid auto-rows-fr gap-6 md:grid-cols-12">
            {/* Verified doctors — big */}
            <article className="ct-hero-shadow group relative flex flex-col justify-between overflow-hidden rounded-[2rem] border border-[rgba(116,118,134,0.18)] bg-white p-8 sm:p-10 md:col-span-8">
              <div>
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4ff] text-[#2563EB] transition group-hover:bg-[#2563EB] group-hover:text-white">
                  {(() => {
                    const Icon = trustItems[0].icon;
                    return <Icon className="h-7 w-7" />;
                  })()}
                </div>
                <h3 className="font-heading text-2xl font-semibold text-[#0b1c30]">
                  {trustItems[0].title}
                </h3>
                <p className="mt-4 max-w-md text-base leading-7 text-[#434655]">
                  {trustItems[0].text}
                </p>
              </div>
              <div className="mt-10 flex items-center gap-3">
                <div className="flex -space-x-3">
                  {doctors.map((doctor) => (
                    <div
                      key={doctor.name}
                      className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-[#dce9ff] shadow-sm"
                    >
                      <Image
                        src={doctor.image}
                        alt={doctor.name}
                        width={120}
                        height={120}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-semibold text-[#0b1c30]">+ board-certified specialists</span>
              </div>
            </article>

            {/* Licensed nurses — dark */}
            <article className="group relative overflow-hidden rounded-[2rem] bg-[#0b1c30] p-8 sm:p-10 md:col-span-4">
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB]/25 text-[#b7c4ff]">
                {(() => {
                  const Icon = trustItems[1].icon;
                  return <Icon className="h-7 w-7" />;
                })()}
              </div>
              <h3 className="font-heading text-2xl font-semibold text-white">{trustItems[1].title}</h3>
              <p className="mt-4 text-base leading-7 text-white/75">{trustItems[1].text}</p>
              <div className="mt-8 space-y-2">
                <div className="ct-glass-dark rounded-xl px-4 py-2.5 text-sm text-white/90">Mother & baby visits</div>
                <div className="ct-glass-dark rounded-xl px-4 py-2.5 text-sm text-white/90">Elderly care support</div>
              </div>
            </article>

            {/* Secure payments */}
            <article className="ct-hero-shadow group rounded-[2rem] border border-[rgba(116,118,134,0.18)] bg-white p-8 sm:p-10 md:col-span-4">
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4ff] text-[#2563EB] transition group-hover:bg-[#2563EB] group-hover:text-white">
                {(() => {
                  const Icon = trustItems[2].icon;
                  return <Icon className="h-7 w-7" />;
                })()}
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#0b1c30]">{trustItems[2].title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#434655]">{trustItems[2].text}</p>
            </article>

            {/* 24/7 access */}
            <article className="ct-hero-shadow group rounded-[2rem] border border-[rgba(116,118,134,0.18)] bg-white p-8 sm:p-10 md:col-span-4">
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4ff] text-[#2563EB] transition group-hover:bg-[#2563EB] group-hover:text-white">
                {(() => {
                  const Icon = trustItems[3].icon;
                  return <Icon className="h-7 w-7" />;
                })()}
              </div>
              <h3 className="font-heading text-xl font-semibold text-[#0b1c30]">{trustItems[3].title}</h3>
              <p className="mt-3 text-sm leading-7 text-[#434655]">{trustItems[3].text}</p>
            </article>

            {/* Live consultations */}
            <article className="group flex flex-col justify-between rounded-[2rem] border border-[rgba(116,118,134,0.18)] bg-[#e5eeff] p-8 sm:p-10 md:col-span-4">
              <div>
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB]/10 text-[#2563EB]">
                  {(() => {
                    const Icon = trustItems[4].icon;
                    return <Icon className="h-7 w-7" />;
                  })()}
                </div>
                <h3 className="font-heading text-xl font-semibold text-[#0b1c30]">{trustItems[4].title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#434655]">{trustItems[4].text}</p>
              </div>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center gap-2 text-xs font-semibold text-[#0b1c30]">
                  <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                  Secure messaging
                </li>
                <li className="flex items-center gap-2 text-xs font-semibold text-[#0b1c30]">
                  <CheckCircle2 className="h-4 w-4 text-[#2563EB]" />
                  Connected follow-ups
                </li>
              </ul>
            </article>
          </div>
        </section>
      </div>

      {/* Doctor showcase — dark */}
      <section id="doctors" className="overflow-hidden bg-[#0b1c30] py-24 text-white sm:py-28 lg:py-32">
        <div className="mx-auto max-w-[1440px] px-4 md:px-10">
          <div className="mb-14 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl">
              <p className="ct-caption mb-4 block text-[#b7c4ff]">Doctors</p>
              <h2 className="font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl">
                Meet the doctors behind Caretekk.
              </h2>
            </div>
            <Link
              href="/register"
              className="ct-glass-dark inline-flex items-center gap-2 rounded-3xl px-7 py-3.5 font-semibold text-white transition hover:bg-white/15"
            >
              Book consultation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((doctor) => (
              <article
                key={doctor.name}
                className="group relative aspect-[3/4] cursor-pointer overflow-hidden rounded-[2rem]"
              >
                <Image
                  src={doctor.image}
                  alt={doctor.name}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top grayscale transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b1c30] via-[#0b1c30]/30 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full translate-y-2 p-6 transition-transform duration-500 group-hover:translate-y-0">
                  <p className="ct-caption mb-1 text-[#b7c4ff]">Caretekk specialist</p>
                  <h4 className="font-heading text-lg font-bold leading-tight text-white">{doctor.name}</h4>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ₦2,000 consultation banner */}
      <section className="px-4 py-20 md:px-10 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#1e40af_0%,#2563EB_58%,#7ca4d7_100%)] p-10 text-white shadow-[0_28px_72px_-44px_rgba(29,78,216,0.55)] sm:p-12 lg:p-16">
            <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="relative z-10">
              <p className="ct-caption text-white/75">Doctor consultations</p>
              <h2 className="mt-4 max-w-[16ch] font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl">
                See a doctor for ₦2,000.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-8 text-white/85 sm:text-lg">
                Book a session with a trusted doctor from the comfort of your home.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-3xl bg-white px-8 py-4 font-bold text-[#1e40af] shadow-[0_18px_38px_-18px_rgba(255,255,255,0.4)] transition hover:-translate-y-0.5"
                >
                  Book consultation
                </Link>
                <a
                  id="demo"
                  href={`mailto:${BRAND_SUPPORT_EMAIL}?subject=Caretekk%20Demo%20Request`}
                  className="ct-glass-dark inline-flex items-center justify-center rounded-3xl px-8 py-4 font-semibold text-white transition hover:bg-white/15"
                >
                  Book a demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Home care */}
      <section id="home-care" className="bg-[linear-gradient(180deg,#ffffff_0%,#f5f9ff_100%)] px-4 py-24 md:px-10 lg:py-32">
        <div className="mx-auto grid max-w-[1440px] items-center gap-12 lg:grid-cols-[minmax(320px,0.96fr)_minmax(0,1.04fr)] lg:gap-16">
          <div className="overflow-hidden rounded-[2.5rem] border border-white/80 bg-white shadow-[0_26px_64px_-44px_rgba(15,23,42,0.28)]">
            <Image
              src="/img/Nurses.png"
              alt="Trusted home-care nurse supporting a patient"
              width={1200}
              height={900}
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <p className="ct-caption text-[#2563EB]">Homecare support</p>
            <h2 className="mt-4 font-heading text-3xl font-semibold leading-tight text-[#0b1c30] sm:text-4xl">
              Care at home for recovery, routine support, and family needs.
            </h2>
            <p className="mt-5 text-base leading-8 text-[#434655] sm:text-lg">
              Caretekk connects you with trusted home-care nurses for mother and baby care, elderly care, postnatal support, and general homecare follow-up.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 text-sm font-medium">
              {homeCareChips.map((chip) => (
                <span key={chip} className="rounded-full bg-[#dce9ff] px-4 py-2 text-[#1e40af]">
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-3xl bg-[#2563EB] px-8 py-4 font-bold text-white shadow-[0_18px_38px_-18px_rgba(29,78,216,0.55)] transition hover:-translate-y-0.5"
              >
                Book a nurse
              </Link>
              <Link
                href="/login"
                className="ct-glass inline-flex items-center justify-center rounded-3xl px-8 py-4 font-semibold text-[#0b1c30] transition hover:bg-[#eff4ff]"
              >
                Request home care
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works — timeline */}
      <section id="how-it-works" className="mx-auto max-w-[1000px] px-4 py-24 md:px-10 lg:py-32">
        <div className="mb-16 text-center">
          <p className="ct-caption text-[#2563EB]">How it works</p>
          <h2 className="mt-4 font-heading text-3xl font-semibold leading-tight text-[#0b1c30] sm:text-4xl">
            A simple path from sign-up to care.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#434655] sm:text-lg">
            Caretekk keeps the care journey clear so patients always know the next step.
          </p>
        </div>

        <div className="relative space-y-12 md:space-y-16">
          <div className="absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-[rgba(116,118,134,0.2)] md:block" />

          {howItWorksSteps.map((step, i) => {
            const Icon = stepIcons[i] ?? Calendar;
            const reversed = i % 2 === 1;
            const progress = ((i + 1) / howItWorksSteps.length) * 100;

            return (
              <div
                key={step.id}
                className={`group relative flex flex-col items-center gap-8 md:flex-row md:gap-12 ${
                  reversed ? "md:flex-row-reverse" : ""
                }`}
              >
                <div className={`flex-1 text-center md:text-left ${reversed ? "" : "md:text-right"}`}>
                  <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2563EB] font-bold text-white md:hidden">
                    {step.id}
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-[#0b1c30] sm:text-2xl">{step.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-[#434655] sm:text-base">{step.text}</p>
                </div>

                <div className="relative z-10 hidden h-12 w-12 items-center justify-center rounded-full border-2 border-[#2563EB] bg-white font-bold text-[#2563EB] transition group-hover:bg-[#2563EB] group-hover:text-white md:flex">
                  {step.id}
                </div>

                <div className="w-full flex-1">
                  <div
                    className={`rounded-[1.5rem] border border-[rgba(116,118,134,0.15)] bg-[#e5eeff] p-5 shadow-sm transition duration-500 group-hover:rotate-0 sm:p-6 ${
                      reversed ? "md:-rotate-1" : "md:rotate-1"
                    }`}
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <Icon className="h-5 w-5 text-[#2563EB]" />
                      <span className="text-sm font-semibold text-[#0b1c30]">{step.title}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full bg-[#2563EB] transition-all duration-700"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-[1440px] px-4 pb-24 md:px-10">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0b1c30] px-6 py-16 text-center sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#2563EB]/30 blur-[100px]" />
          <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#00687a]/25 blur-[100px]" />

          <div className="relative z-10 mx-auto max-w-2xl">
            <div className="mb-6 flex justify-center">
              <BrandLockup wordmark="image" inverse />
            </div>
            <p className="ct-caption mb-2 text-white/65">Start today</p>
            <h2 className="font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl">
              Healthcare that feels modern, trusted, and close to home.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-white/80 sm:text-lg">
              Book trusted care, keep records close, and move from symptoms to follow-up without confusion.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-3xl bg-white px-8 py-4 font-bold text-[#1e40af] shadow-[0_18px_38px_-18px_rgba(255,255,255,0.35)] transition hover:-translate-y-0.5"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="ct-glass-dark inline-flex items-center justify-center rounded-3xl px-8 py-4 font-semibold text-white transition hover:bg-white/15"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-[rgba(116,118,134,0.15)] bg-[#eff4ff] py-16 sm:py-20">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-4 md:grid-cols-4 md:px-10">
          <div className="md:col-span-1">
            <BrandLockup href="/" />
            <p className="mt-6 max-w-xs text-sm leading-7 text-[#434655]">
              Trusted digital healthcare for doctor consultations, homecare support, records, and follow-up care.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://www.linkedin.com/company/caretekk-health-technologies-ltd/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Caretekk on LinkedIn"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(116,118,134,0.2)] bg-white text-[#0b1c30] transition hover:border-[#2563EB] hover:text-[#2563EB]"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://www.facebook.com/share/1BSrQHdC8m/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Caretekk on Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(116,118,134,0.2)] bg-white text-[#0b1c30] transition hover:border-[#2563EB] hover:text-[#2563EB]"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@caretekk.health"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Caretekk on TikTok"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(116,118,134,0.2)] bg-white text-[#0b1c30] transition hover:border-[#2563EB] hover:text-[#2563EB]"
              >
                <TikTokIcon className="h-4 w-4" />
              </a>
              <a
                href={`mailto:${BRAND_SUPPORT_EMAIL}`}
                aria-label="Email support"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(116,118,134,0.2)] bg-white text-[#0b1c30] transition hover:border-[#2563EB] hover:text-[#2563EB]"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="ct-caption mb-5 text-[#0b1c30]">Product</h4>
            <ul className="space-y-3">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-[#434655] transition hover:text-[#2563EB]">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="ct-caption mb-5 text-[#0b1c30]">Company</h4>
            <ul className="space-y-3">
              <li>
                <a href="#trust" className="text-sm text-[#434655] transition hover:text-[#2563EB]">
                  Why Caretekk
                </a>
              </li>
              <li>
                <a href="#doctors" className="text-sm text-[#434655] transition hover:text-[#2563EB]">
                  Our doctors
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-[#434655] transition hover:text-[#2563EB]">
                  How it works
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="ct-caption mb-5 text-[#0b1c30]">Support</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${BRAND_SUPPORT_EMAIL}`}
                  className="text-sm text-[#434655] transition hover:text-[#2563EB]"
                >
                  {BRAND_SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <Link href="/login" className="text-sm text-[#434655] transition hover:text-[#2563EB]">
                  Sign in
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-[#434655] transition hover:text-[#2563EB]">
                  Create account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-16 flex max-w-[1440px] flex-col items-center justify-between gap-4 border-t border-[rgba(116,118,134,0.15)] px-4 pt-8 text-center md:flex-row md:px-10 md:text-left">
          <p className="text-xs text-[#747686]">
            © {new Date().getFullYear()} {BRAND_NAME} Healthcare. Built for trusted, modern care.
          </p>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#434655]">
              System Status: Operational
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

/**
 * Perspective floor grid behind the hero, traced from the design (986×956 card, design px):
 * horizontal rules spaced wider towards the bottom, and six lines fanning out from a vanishing
 * point above the card (x=428, 801.6 above the top edge).
 */
function HeroGridLines() {
  const horizontals = [54.5, 141, 248.5, 380, 540, 733];
  const vanishX = 428;
  const bottomScale = 1 + 956 / 801.6;
  const fanOffsets = [-385.8, -228.3, -75.4, 75.4, 228.3, 385.8];

  return (
    <svg
      viewBox="0 0 986 956"
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      <g stroke="white" strokeOpacity={0.2} strokeWidth={1}>
        {horizontals.map((y) => (
          <line key={`h${y}`} x1={0} y1={y} x2={986} y2={y} />
        ))}
        {fanOffsets.map((offset) => (
          <line key={`f${offset}`} x1={vanishX + offset} y1={0} x2={vanishX + offset * bottomScale} y2={956} />
        ))}
      </g>
    </svg>
  );
}

function PlatformCard({
  highlight,
  className = "",
  titleWidthClassName,
}: {
  highlight: (typeof platformHighlights)[number];
  className?: string;
  /** Replaces the default title text-box width. */
  titleWidthClassName?: string;
}) {
  const { title, text, icon: Icon, tone } = highlight;
  const dark = tone === "dark";
  const titleWidth = titleWidthClassName ?? (dark ? "max-w-[330px]" : "max-w-[444px]");

  // Text boxes are narrower than the cards so lines break where the design breaks them.
  return (
    <article
      className={`rounded-[31.8px] pb-10 ${
        dark
          ? "bg-[#1E3A8A] pl-[27.5px] pr-5 pt-[30.2px] shadow-[0_20px_48px_-6px_rgba(15,23,42,0.1)]"
          : "bg-[#EFF6FF] px-[33.9px] pt-[30.7px]"
      } ${className}`}
    >
      <span
        className={`flex items-center justify-center rounded-full text-white ${
          dark
            ? "ml-[11.8px] h-[54px] w-[54px] bg-white/[0.23] shadow-[0_8px_18px_rgba(255,255,255,0.08)]"
            : "h-[53.5px] w-[53.5px] bg-[#3B82F6] shadow-[0_6px_14px_-2px_rgba(15,23,42,0.18)]"
        }`}
      >
        <Icon className="h-8 w-8" />
      </span>
      <h3
        className={`text-[20.45px] font-bold leading-[23.6px] ${titleWidth} ${
          dark ? "mt-[33.5px] text-white" : "mt-[34.5px] text-[#223245]"
        }`}
      >
        {title}
      </h3>
      <p
        className={`${
          dark ? "mt-[14px] max-w-[330px] text-[16.5px] leading-[25px] text-white" : "mt-[13px] max-w-[444px] text-base leading-[25.4px] text-[#434655]"
        }`}
      >
        {text}
      </p>
    </article>
  );
}
