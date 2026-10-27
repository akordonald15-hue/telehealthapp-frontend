import Image from "next/image";
import { howItWorksSteps } from "@/features/marketing/data";

const photoBands = [
  {
    width: 1041,
    height: 626,
    band: "left-0 top-[43.572%] h-[56.428%] w-full",
    lg: "",
  },
  {
    width: 1041,
    height: 665,
    band: "left-0 top-[40.054%] h-[59.946%] w-full",
    lg: "",
  },
  {
    width: 1538,
    height: 965,
    band: "left-0 top-[42.084%] h-[57.916%] w-full md:top-[42.084%] md:h-[57.916%]",
    lg: "lg:left-[27.562%] lg:top-[12.991%] lg:w-[72.438%] lg:h-[87.009%]",
  },
];


export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative overflow-hidden bg-white py-20 lg:pt-[6.25rem] lg:pb-[11.125rem]"
    >
      <div className="fluid-canvas mx-auto px-4 md:px-10">
        <header className="mb-6 flex flex-col items-center gap-[0.875rem] text-center md:mb-8 lg:mb-[calc(3.4375*var(--u))]">
          <p className="text-[1.5rem] font-light uppercase leading-[1.5] tracking-normal text-primary-dark lg:text-[calc(1.8125*var(--u))]">
            how it works
          </p>
          <h2
            id="how-it-works-heading"
            className="mx-auto max-w-[42.5rem] font-heading text-[clamp(1.875rem,4vw,3.4375rem)] font-bold leading-[1.2] tracking-normal text-ink md:max-lg:text-[clamp(2.75rem,7.4vw,3.4375rem)] lg:max-w-[calc(42.5*var(--u))] lg:text-[calc(3.4375*var(--u))]"
          >
            Care In <span className="text-accent-strong">Three</span> Simple Steps.
          </h2>
        </header>

        <div className="relative mt-12 lg:mt-[3.75rem]">
          <ul className="relative z-10 grid gap-6 md:gap-y-[3.375rem] lg:mx-auto lg:max-w-[calc(80*var(--u))] lg:grid-cols-2 lg:gap-x-[calc(1.6875*var(--u))] lg:gap-y-[calc(3.4375*var(--u))]">
            {howItWorksSteps.map((step, idx) => (
              <li
                key={step.num}
                className={`relative overflow-hidden rounded-[3.125rem] ${step.fill} min-h-[16rem] md:aspect-[774/739] ${step.num === "03" ? "lg:col-span-2 lg:aspect-[1415/739]" : "lg:aspect-[694/739]"}`}
              >
                <div className="pointer-events-none absolute inset-0 z-0 hidden md:block">
                  <Image
                    src={step.image}
                    alt={step.title}
                    width={photoBands[idx].width}
                    height={photoBands[idx].height}
                    sizes="(min-width: 1024px) 930px, 100vw"
                     className={`absolute object-cover object-center ${photoBands[idx].band} ${photoBands[idx].lg} max-md:object-contain max-md:object-[center_bottom] max-md:max-h-[95%]`}
                  />
                </div>
                <div className="pointer-events-none absolute inset-0 z-0 hidden lg:block">
                  {idx === 0 && (
                    <>
                      <span className="absolute left-[calc(16.1875*var(--u))] top-[calc(15.75*var(--u))] h-[calc(48.0625*var(--u))] w-[calc(48.0625*var(--u))] rounded-full bg-white opacity-5" />
                      <span className="absolute left-[calc(23.268*var(--u))] top-[calc(22.890625*var(--u))] h-[calc(33.841875*var(--u))] w-[calc(33.841875*var(--u))] rounded-full bg-white opacity-10" />
                    </>
                  )}
                  {idx === 1 && (
                    <>
                      <span className="absolute left-[calc(13.6875*var(--u))] top-[calc(18.4375*var(--u))] h-[calc(48.0625*var(--u))] w-[calc(48.0625*var(--u))] rounded-full bg-white opacity-5" />
                      <span className="absolute left-[calc(20.8125*var(--u))] top-[calc(25.5625*var(--u))] h-[calc(33.841875*var(--u))] w-[calc(33.841875*var(--u))] rounded-full bg-white opacity-10" />
                    </>
                  )}
                  {idx === 2 && (
                    <>
                      <span className="absolute left-[calc(-9.875*var(--u))] top-[calc(17.5*var(--u))] h-[calc(48.0625*var(--u))] w-[calc(48.0625*var(--u))] rounded-full bg-white opacity-10" />
                      <span className="absolute left-[calc(-2.794375*var(--u))] top-[calc(24.640625*var(--u))] h-[calc(33.841875*var(--u))] w-[calc(33.841875*var(--u))] rounded-full bg-white opacity-10" />
                    </>
                  )}
                </div>
                <div className="relative z-10 flex flex-col gap-6 p-6 sm:p-8 lg:gap-[calc(2.75*var(--u))] lg:p-[calc(2.75*var(--u))] lg:pt-[calc(5.0625*var(--u))]">
                  <span className="grid h-20 w-20 place-items-center rounded-[1.875rem] bg-white/20 text-white md:h-[6.25rem] md:w-[6.25rem] md:rounded-[2.5rem] lg:h-[calc(6.25*var(--u))] lg:w-[calc(6.25*var(--u))] lg:rounded-[calc(2.5*var(--u))]">
                    <span className="text-[1.75rem] font-semibold leading-none md:text-[2.1875rem] lg:text-[calc(2.1875*var(--u))]">
                      {step.num}
                  </span>
                  </span>
                  <div className="flex flex-col gap-[1.125rem]">
                    <h3 className="font-heading text-[1.375rem] font-bold leading-[1.2] tracking-normal text-white md:text-[1.9375rem] lg:text-[calc(1.75*var(--u))]">
                      {step.title}
                    </h3>
                    <p className="max-w-[30.5625rem] text-[1.0625rem] font-normal leading-[1.5] text-white md:text-[1.5625rem] lg:max-w-[calc(30.5625*var(--u))] lg:text-[calc(1.4125*var(--u))]">
                      {step.text}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>


        </div>
      </div>
    </section>
  );
}
