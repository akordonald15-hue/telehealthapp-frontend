import Image from "next/image";
import Link from "next/link";

import { getStartedCta } from "@/features/marketing/data";

export function GetStartedSection() {
  return (
    <section
      id="get-started"
      aria-labelledby="get-started-heading"
      className="relative overflow-hidden border-t border-white bg-primary-dark"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 hidden h-[6.1875rem] w-[2.8125rem] bg-[radial-gradient(circle,white_0.09375rem,transparent_0.09375rem)] bg-[length:0.5625rem_0.5625rem] opacity-50 lg:block"
      />

      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
          <span className="absolute left-[61.8%] top-[13.6%] h-[34.8rem] w-[34.8rem] rounded-full bg-white/5" />
          <span className="absolute left-[67.9%] top-[25.9%] h-[24.5rem] w-[24.5rem] rounded-full bg-white/[0.04]" />
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-[25%] bottom-0 z-10 hidden w-[70%] lg:block"
        >
          <Image
            src="/img/get-started-care.png"
            alt=""
            fill
            sizes="50vw"
            className="object-cover"
          />
        </div>

        <div className="relative z-20 py-16 md:pt-[13.0625rem] md:pb-0 lg:grid lg:grid-cols-[46rem_1fr] lg:pt-[5.2rem] lg:pb-[7.25rem]">
          <div className="relative z-10">
            <h2
              id="get-started-heading"
              className="whitespace-pre-line font-heading text-[clamp(1.875rem,4vw,3.8125rem)] font-bold leading-[1.2] tracking-normal text-white md:max-lg:text-[clamp(2.75rem,7.4vw,3.8125rem)] lg:text-[clamp(3.5625rem,4vw,3.8125rem)]"
            >
              {getStartedCta.heading}
            </h2>
            <p className="mt-7 whitespace-pre-line font-heading text-[1.0625rem] font-normal leading-[1.5] tracking-normal text-white md:max-lg:mt-[2.375rem] md:text-[1.6875rem] lg:mt-[1.8125rem] lg:text-[1.6875rem]">
              {getStartedCta.body}
            </p>

            <div className="mt-12 flex flex-col gap-4 sm:flex-row md:flex-nowrap md:max-lg:mt-[4.5625rem] md:gap-[1.875rem] lg:mt-16 lg:flex-nowrap lg:gap-[3.125rem]">
              <Link
                href={getStartedCta.primaryHref}
                className="inline-flex h-[3.75rem] items-center justify-center whitespace-nowrap gap-[1.125rem] rounded-full bg-accent-strong px-6 font-heading text-lg font-normal tracking-normal text-white shadow-[0_9px_20px_rgba(158,154,154,0.10),0_36px_36px_rgba(158,154,154,0.09),0_81px_48px_rgba(158,154,154,0.05),0_144px_57px_rgba(158,154,154,0.01)] transition hover:-translate-y-0.5 hover:brightness-105 md:flex-1 md:h-[5.625rem] md:gap-[1.1875rem] md:px-10 md:text-[1.6875rem] lg:h-[5.625rem] lg:gap-[1.1875rem] lg:px-10 lg:text-[1.6875rem]"
              >
                {getStartedCta.primaryLabel}
                <Image
                  src="/img/arrow-right.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-8 w-8 shrink-0 md:h-10 md:w-10 lg:h-10 lg:w-10"
                />
              </Link>
              <Link
                href={getStartedCta.secondaryHref}
                className="inline-flex h-[3.75rem] items-center justify-center whitespace-nowrap gap-[1.125rem] rounded-full border-2 border-white bg-transparent px-6 font-heading text-lg font-normal tracking-normal text-white transition hover:-translate-y-0.5 hover:bg-white/10 md:flex-1 md:h-[5.625rem] md:gap-[1.375rem] md:px-10 md:text-[1.75rem] lg:h-[5.625rem] lg:gap-[1.375rem] lg:px-10 lg:text-[1.75rem]"
              >
                {getStartedCta.secondaryLabel}
                <Image
                  src="/img/clinic.png"
                  alt=""
                  width={40}
                  height={40}
                  className="h-8 w-8 shrink-0 md:h-10 md:w-10 lg:h-10 lg:w-10"
                />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative -mx-4 overflow-hidden pb-16 md:-mx-10 md:aspect-[834/638] md:pb-0 lg:hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <span className="absolute -top-10 left-1/4 h-72 w-72 rounded-full bg-white/5 md:hidden" />
            <span className="absolute left-1/2 top-[29.6%] hidden aspect-square w-[93.8%] -translate-x-1/2 rounded-full bg-white/10 md:block" />
            <span className="absolute left-1/2 top-[47.8%] hidden aspect-square w-[66%] -translate-x-1/2 rounded-full bg-white/10 md:block" />
          </div>
          <Image
            src="/img/get-started-care.png"
            alt=""
            width={1745}
            height={917}
            sizes="100vw"
            className="relative h-auto w-full object-cover md:absolute md:left-1/2 md:top-1/2 md:w-[170%] md:max-w-none md:-translate-x-1/2 md:-translate-y-1/2 md:object-contain"
          />
        </div>
      </div>
    </section>
  );
}
