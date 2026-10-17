import Image from "next/image";
import { technologySteps } from "@/features/marketing/data";

const pillOffsets = [
  "lg:ml-[-8.75rem]",
  "lg:ml-[0.9375rem] lg:mt-[2.25rem]",
  "lg:ml-[-7.125rem] lg:mt-[3.125rem]",
  "lg:ml-[-2.625rem] lg:mt-[3.4375rem]",
];

const pillWidths = ["lg:w-[35.75rem]", "lg:w-[49.375rem]", "lg:w-[42rem]", "lg:w-[50.4375rem]"];

const pillOffsetsMd = ["md:ml-0", "md:ml-[0.125rem]", "md:ml-[0.125rem]", "md:ml-[-0.75rem]"];



export function TechnologySection() {
  return (
    <section
      id="technology"
      aria-labelledby="technology-heading"
      className="relative overflow-hidden bg-primary-dark py-24 md:max-lg:pt-0 md:max-lg:pb-[4.5625rem] lg:pt-[10.125rem] lg:pb-[6.5rem]"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 hidden h-[10.125rem] w-[2.8125rem] bg-[radial-gradient(circle,white_0.09375rem,transparent_0.09375rem)] bg-[length:0.5625rem_0.5625rem] opacity-50 lg:block"
      />
      <div className="relative mx-auto max-w-[1440px] px-4 md:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 block">
          <span className="absolute left-1/2 top-0 aspect-square w-[70%] -translate-x-1/2 rounded-full bg-white/10 md:max-lg:left-1/2 md:max-lg:top-[18.5625rem] md:max-lg:h-[32.875rem] md:max-lg:w-[32.875rem] md:max-lg:aspect-auto md:max-lg:-translate-x-1/2 lg:left-[-2.875rem] lg:top-[14.3125rem] lg:h-[39.9375rem] lg:w-[39.9375rem] lg:aspect-auto lg:translate-x-0" />
          <span className="absolute left-1/2 top-[10vw] aspect-square w-[48%] -translate-x-1/2 rounded-full bg-white/10 md:max-lg:left-1/2 md:max-lg:top-[23.445rem] md:max-lg:h-[23.148rem] md:max-lg:w-[23.148rem] md:max-lg:aspect-auto md:max-lg:-translate-x-1/2 lg:left-[3rem] lg:top-[20.25rem] lg:h-[28.125rem] lg:w-[28.125rem] lg:aspect-auto lg:translate-x-0" />
        </div>

        <div className="relative grid gap-10 md:gap-[3.5625rem] lg:grid-cols-[45.5%_1fr] lg:gap-0">
          <div className="relative z-0">
            <div className="relative mx-auto aspect-[1245/934] w-full max-w-[34rem] origin-bottom scale-[1.6] md:scale-100 md:max-lg:left-1/6 md:max-lg:aspect-[1245/934] md:max-lg:w-[161%] md:max-lg:max-w-none md:max-lg:-translate-x-1/6 lg:absolute lg:left-[-4.9582rem] lg:top-[-4.3537rem] lg:mx-0 lg:aspect-auto lg:h-[58.3777rem] lg:w-[58.3777rem] lg:max-w-none">
              <Image
                src="/img/technology-care.png"
                alt="Caretekk technology-enabled care"
                fill
                priority={false}
                sizes="(min-width: 1024px) 1085px, 100vw"
                className="object-contain object-right md:object-center"
              />
            </div>
          </div>

          <div className="relative z-10">
            <h2
              id="technology-heading"
              className="font-heading text-[clamp(1.875rem,4vw,3.8125rem)] font-bold leading-[1.2] tracking-normal text-white md:max-lg:text-[clamp(2.75rem,7.4vw,3.8125rem)] lg:text-[clamp(3.5625rem,4vw,3.8125rem)]"
            >
              Technology-Enabled Care, Not a Phone Book of Contacts.
            </h2>
            <p className="mt-[2.0625rem] text-[1.0625rem] font-normal leading-[1.5] tracking-normal text-white md:text-[1.6875rem]">
              Caretekk isn&#39;t a list of names and numbers, it&#39;s a platform built to get you care
              quickly and safely. Book in a few taps, track your provider in real time, message your
              care team, and keep every visit on record.
            </p>
            <ul className="mt-10 grid gap-8 md:max-lg:mt-[10.3125rem] md:gap-[2.6875rem] lg:gap-0">
              {technologySteps.map((step, index) => (
                <li
                  key={step.num}
                  className={`flex w-full max-w-full items-center gap-4 rounded-full bg-primary-halo-strong/20 py-2 pl-[1.125rem] pr-[1.125rem] md:w-fit lg:max-w-none md:gap-[1.5625rem] md:py-[0.625rem] md:pl-[1.4375rem] md:pr-[1.4375rem] lg:gap-[1.5625rem] lg:py-[0.625rem] lg:pl-[1.4375rem] lg:pr-[1.4375rem] ${pillOffsetsMd[index]} ${pillOffsets[index]} ${pillWidths[index]}`}
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/20 text-[1.5rem] font-semibold leading-none text-white md:h-[4.375rem] md:w-[4.375rem] md:rounded-[2.5rem] md:text-[1.875rem] lg:h-[4.375rem] lg:w-[4.375rem] lg:rounded-[2.5rem] lg:text-[1.875rem]">
                    {step.num}
                  </span>
                  <span className="whitespace-normal text-[1.25rem] font-medium leading-[1.5] tracking-normal text-white md:whitespace-nowrap md:text-[clamp(1.25rem,calc((100vw-229px)/26.64),1.5625rem)] lg:whitespace-nowrap lg:text-[1.5625rem]">
                    {step.title}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
