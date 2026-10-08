import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Stethoscope,
} from "lucide-react";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { HeroSlideshow } from "@/components/marketing/hero-slideshow";
import { MarketingHeader } from "@/components/marketing/marketing-header";
import { PlatformStats } from "@/components/marketing/platform-stats";
import { RevealLines } from "@/components/marketing/reveal-lines";
import {
  doctors,
  howItWorksSteps,
  platformHighlights,
  serviceOffers,
  trustItems,
} from "@/features/marketing/data";
import { BRAND_NAME, BRAND_SUPPORT_EMAIL } from "@/lib/brand";
import { SolutionCard } from "./solution-card";
import { ServiceCard } from "./service-card";

const LIGHT_DOTS = "bg-[radial-gradient(rgb(78_82_229/0.1)_1px,transparent_1.4px)] bg-[size:16px_16px]";
const PANEL_DOTS = "bg-[radial-gradient(rgb(255_255_255/0.12)_1px,transparent_1.4px)] bg-[size:16px_16px]";
import { FaqSection } from "@/components/marketing/faq-section";
import { SiteFooter } from "@/components/marketing/site-footer";

const homeCareChips = ["Mother & baby care", "Elderly care", "Postnatal care", "General homecare"];
const stepIcons = [Calendar, Stethoscope, Sparkles, MessageCircle];

export function LandingPage() {
  const [advice, homeVisits, verified, confirmation, pricing] = platformHighlights;
  const [doctorVisits, homeNursing, elderlyCare, maternalCare] = serviceOffers;

  return (
    <main id="home" className="min-h-screen overflow-x-hidden bg-[#f8f9ff] text-[#0b1c30]">
      {/* Sizes in the two redesigned sections are design px on a 1000px frame; .lp-scale zooms them from lg up. */}
      <div className="@container">
        {/* Hero */}
        <section className="lp-scale bg-white px-[7px] pb-[3px] pt-[7px]">
          <div className="relative overflow-hidden rounded-[18.5px] bg-[linear-gradient(180deg,#2563EB_0%,#60A5FA_100%)] pt-[163.5px] text-center max-lg:px-4 max-lg:pt-[104px]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgb(255_255_255/0.22)_1px,transparent_1.4px)] bg-[size:16px_16px]"
            />
            <MarketingHeader />
            <HeroSlideshow />
          </div>
        </section>

        <section aria-label={`${BRAND_NAME} in numbers`} className={`lp-scale bg-[#FAFBFF] px-4 py-[46px] ${LIGHT_DOTS}`}>
          <PlatformStats />
        </section>

        <section id="solution" className={`lp-scale bg-[#F2F5FE] px-4 pb-[104px] pt-[72px] ${LIGHT_DOTS}`}>
          <RevealLines className="text-center">
            <p className="text-[14px] font-medium uppercase tracking-[0.2em] text-[#1E40AF]">Solution</p>
            <h2 className="mt-[16px] text-[40.25px] font-bold leading-[48.2px] text-[#131A2F] max-sm:text-[30px] max-sm:leading-[1.2]">
              One <span className="text-[#3B82F6]">Platform.</span> Two
              <br /> Ways to Get Real Care.
            </h2>
          </RevealLines>

          <div className="mx-auto mt-[64px] grid w-[946px] max-w-full gap-[24px] max-lg:auto-rows-fr lg:grid-cols-2 lg:items-center">
            <div className="flex flex-col gap-[40px] max-lg:contents">
              <SolutionCard highlight={advice} tall pingDelay={0} />
              <SolutionCard highlight={confirmation} tall pingDelay={1.2} />
            </div>
            <div className="flex flex-col gap-[36px] max-lg:contents">
              <SolutionCard highlight={homeVisits} pingDelay={0.4} />
              <SolutionCard highlight={verified} pingDelay={0.8} />
              <SolutionCard highlight={pricing} pingDelay={1.6} />
            </div>
          </div>
        </section>

        <section id="services" className="lp-scale bg-[#F2F5FE] px-[7px] pb-[7px]">
          <div className={`rounded-[18.5px] bg-[#1E40AF] px-[24px] pb-[104px] pt-[80px] max-sm:px-4 max-sm:pb-16 max-sm:pt-14 ${PANEL_DOTS}`}>
            <RevealLines className="pl-[12px] text-white max-sm:pl-1">
              <p className="text-[15px] font-light uppercase tracking-[0.04em] text-white/85">Our Services</p>
              <h2 className="mt-[18px] text-[40.25px] font-bold leading-[48.2px] max-sm:text-[30px] max-sm:leading-[1.2]">
                What Our
                <br /> Platform Offers.
              </h2>
            </RevealLines>

            <div className="mx-auto mt-[33px] grid w-[938px] max-w-full gap-[22px] max-lg:auto-rows-fr lg:grid-cols-2">
              <div className="flex flex-col gap-[38px] lg:mt-[60px] max-lg:contents">
                <ServiceCard offer={doctorVisits} pingDelay={0} className="max-lg:order-1" />
                <ServiceCard offer={elderlyCare} pingDelay={0.8} className="max-lg:order-3" />
              </div>
              <div className="flex flex-col gap-[38px] max-lg:contents">
                <ServiceCard offer={homeNursing} pingDelay={0.4} className="max-lg:order-2" />
                <ServiceCard offer={maternalCare} pingDelay={1.2} className="max-lg:order-4" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="ct-mesh">
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
                className={`group relative flex flex-col items-center gap-8 md:flex-row md:gap-12 ${reversed ? "md:flex-row-reverse" : ""
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
                    className={`rounded-[1.5rem] border border-[rgba(116,118,134,0.15)] bg-[#e5eeff] p-5 shadow-sm transition duration-500 group-hover:rotate-0 sm:p-6 ${reversed ? "md:-rotate-1" : "md:rotate-1"
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

      <FaqSection />

      <SiteFooter />
    </main>
  );
}



