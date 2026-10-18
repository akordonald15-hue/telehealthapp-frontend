import Image from "next/image";
import { technologySteps } from "@/features/marketing/data";

const pillGeometry = [
  {
    md: "md:ml-0",
    lg: "lg:ml-[calc(-8.75*var(--u))] lg:w-[calc(35.75*var(--u))]",
  },
  {
    md: "md:ml-[0.125rem]",
    lg: "lg:ml-[calc(0.9375*var(--u))] lg:mt-[calc(2.25*var(--u))] lg:w-[calc(49.375*var(--u))]",
  },
  {
    md: "md:ml-[0.125rem]",
    lg: "lg:ml-[calc(-7.125*var(--u))] lg:mt-[calc(3.125*var(--u))] lg:w-[calc(42*var(--u))]",
  },
  {
    md: "md:ml-[-0.75rem]",
    lg: "lg:ml-[calc(-2.625*var(--u))] lg:mt-[calc(3.4375*var(--u))] lg:w-[calc(50.4375*var(--u))]",
  },
];

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
      <div className="fluid-canvas relative mx-auto px-4 md:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 block">
          <span className="absolute left-1/2 top-0 aspect-square w-[70%] -translate-x-1/2 rounded-full bg-white/10 md:max-lg:left-1/2 md:max-lg:top-[18.5625rem] md:max-lg:h-[32.875rem] md:max-lg:w-[32.875rem] md:max-lg:aspect-auto md:max-lg:-translate-x-1/2 lg:left-[calc(-2.875*var(--u))] lg:top-[calc(14.3125*var(--u))] lg:h-[calc(39.9375*var(--u))] lg:w-[calc(39.9375*var(--u))] lg:aspect-auto lg:translate-x-0" />
          <span className="absolute left-1/2 top-[10vw] aspect-square w-[48%] -translate-x-1/2 rounded-full bg-white/10 md:max-lg:left-1/2 md:max-lg:top-[23.445rem] md:max-lg:h-[23.148rem] md:max-lg:w-[23.148rem] md:max-lg:aspect-auto md:max-lg:-translate-x-1/2 lg:left-[calc(3*var(--u))] lg:top-[calc(20.25*var(--u))] lg:h-[calc(28.125*var(--u))] lg:w-[calc(28.125*var(--u))] lg:aspect-auto lg:translate-x-0" />
        </div>

        <div className="relative grid gap-10 md:gap-[3.5625rem] lg:grid-cols-[45.5%_1fr] lg:gap-0">
          <div className="relative z-0">
            <div className="relative mx-auto aspect-[1245/934] w-full max-w-[34rem] origin-bottom scale-[1.3] md:scale-100 md:max-lg:left-1/6 md:max-lg:aspect-[1245/934] md:max-lg:w-[161%] md:max-lg:max-w-none md:max-lg:-translate-x-1/6 lg:absolute lg:left-[calc(-4.9582*var(--u))] lg:top-[calc(-4.3537*var(--u))] lg:mx-0 lg:aspect-auto lg:h-[calc(58.3777*var(--u))] lg:w-[calc(58.3777*var(--u))] lg:max-w-none">
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
              className="font-heading text-[clamp(1.875rem,4vw,3.8125rem)] font-bold leading-[1.2] tracking-normal text-white md:max-lg:text-[clamp(2.75rem,7.4vw,3.8125rem)] lg:text-[calc(3.5625*var(--u))]"
            >
              Technology-Enabled Care, Not a Phone Book of Contacts.
            </h2>
            <p className="mt-[2.0625rem] text-[1.0625rem] font-normal leading-[1.5] tracking-normal text-white md:text-[1.6875rem] lg:mt-[calc(2.0625*var(--u))] lg:text-[calc(1.6875*var(--u))]">
              Caretekk isn&#39;t a list of names and numbers, it&#39;s a platform built to get you care
              quickly and safely. Book in a few taps, track your provider in real time, message your
              care team, and keep every visit on record.
            </p>
            <ul className="mt-10 grid gap-8 md:max-lg:mt-[10.3125rem] md:gap-[2.6875rem] lg:mt-[calc(2.5*var(--u))] lg:gap-0">
              {technologySteps.map((step, index) => (
                <li
                  key={step.num}
                  className={`flex w-full max-w-full items-center gap-4 rounded-full bg-primary-halo-strong/20 py-2 pl-[1.125rem] pr-[1.125rem] md:w-fit lg:max-w-none md:gap-[1.5625rem] md:py-[0.625rem] md:pl-[1.4375rem] md:pr-[1.4375rem] lg:gap-[calc(1.5625*var(--u))] lg:py-[calc(0.625*var(--u))] lg:pl-[calc(1.4375*var(--u))] lg:pr-[calc(1.4375*var(--u))] ${pillGeometry[index].md} ${pillGeometry[index].lg}`}
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/20 text-[1.5rem] font-semibold leading-none text-white md:h-[4.375rem] md:w-[4.375rem] md:rounded-[2.5rem] md:text-[1.875rem] lg:h-[calc(4.375*var(--u))] lg:w-[calc(4.375*var(--u))] lg:rounded-[calc(2.5*var(--u))] lg:text-[calc(1.875*var(--u))]">
                    {step.num}
                  </span>
                  <span className="whitespace-normal text-[1.25rem] font-medium leading-[1.5] tracking-normal text-white md:whitespace-nowrap md:text-[clamp(1.25rem,calc((100vw-229px)/26.64),1.5625rem)] lg:whitespace-nowrap lg:text-[calc(1.5625*var(--u))]">
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
