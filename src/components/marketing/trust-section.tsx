import Image from "next/image";
import { trustCards } from "@/features/marketing/data";
import { DirectRightIcon, ForwardIcon, GalleryEditIcon, Note2Icon } from "@/components/marketing/trust-icons";

const cardIcons = [Note2Icon, GalleryEditIcon, ForwardIcon, DirectRightIcon];

const cardOffsets = [
  "lg:translate-x-[78px]",
  "md:translate-x-[9.7%] lg:translate-x-0",
  "lg:translate-x-[110px] md:translate-x-[13%]",
  "md:translate-x-[2.6%] lg:translate-x-0",
];

export function TrustSection() {
  return (
    <section
      id="trust"
      aria-labelledby="trust-heading"
      className="relative overflow-hidden bg-primary-tint py-24 md:py-[10.6875rem] lg:py-[6.125rem]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle,#EBEBEB_0.125rem,transparent_0.125rem)] bg-[length:1.5rem_1.5rem] bg-[position:-0.34375rem_-0.78125rem]"
      />
      <div className="relative z-10 mx-auto max-w-[1440px] px-4 md:px-10">
        <header className="flex flex-col items-center gap-3.5 text-center">
          <p className="text-[1.5rem] font-light uppercase leading-[1.5] tracking-normal text-primary-dark md:text-[2rem] lg:text-[2rem] lg:leading-[1.5]">
            trust
          </p>
          <h2
            id="trust-heading"
            className="mx-auto max-w-[46.9375rem] font-heading text-[clamp(2.25rem,4vw,3.8125rem)] font-bold leading-[1.2] tracking-normal text-ink md:max-lg:text-[3.8125rem]"
          >
            Care You Can Put Your{" "}
            <span className="text-accent-strong">Family&rsquo;s</span> Name On.
          </h2>
        </header>

        <div className="mt-9 grid gap-10 md:max-lg:mt-[8.625rem] md:gap-[6.1875rem] lg:grid-cols-[45.5%_1fr] lg:gap-0">
          <div className="relative mx-auto w-full md:w-[96.5%] lg:w-full">
            <div className="relative mx-auto w-full max-w-[36.625rem] md:mx-0 md:w-[97%] md:max-w-none lg:absolute lg:left-[-3.125rem] lg:top-[7.5rem] lg:w-[36.625rem] lg:max-w-none">
              <Image
                src="/img/trust-care-team.png"
                alt="Caretekk professional supporting a patient during a home visit"
                width={970}
                height={1008}
                priority={false}
                className="h-auto w-full shadow-[var(--shadow-trust-photo)]"
              />
            </div>
            <div className="relative z-10 -mt-[33%] ml-auto mr-0 w-[50%] max-w-[18.375rem] md:-mt-[36.4%] md:w-[48%] md:max-w-none lg:absolute lg:bottom-auto lg:left-[18rem] lg:right-auto lg:mt-0 lg:w-[18.375rem] lg:max-w-none lg:top-[31.5625rem]">
              <Image
                src="/img/trust-home-visit.png"
                alt=""
                width={487}
                height={505}
                className="h-auto w-full shadow-[var(--shadow-trust-photo)]"
              />
            </div>
          </div>

          <ul className="grid gap-6 md:gap-[3.4375rem] lg:gap-[3.125rem]">
            {trustCards.map((card, index) => {
              const Icon = cardIcons[index];
              return (
                <li
                  key={card.title}
                  className={`flex items-center gap-6 rounded-[2.8125rem] bg-surface p-6 shadow-[var(--shadow-trust-card)] sm:p-8 md:min-h-[14.4375rem] md:w-[93%] md:gap-[2.8125rem] md:px-[2.5rem] md:py-0 md:max-lg:rounded-[3.125rem] lg:min-h-[13.0625rem] lg:w-[85%] lg:gap-[2.5625rem] lg:p-[2.625rem] ${cardOffsets[index]}`}
                >
                  <span className="relative grid h-[72px] w-[72px] shrink-0 place-items-center rounded-full bg-primary-halo/50 sm:h-[96px] sm:w-[96px] md:h-[8.6875rem] md:w-[8.6875rem] lg:h-[126px] lg:w-[126px]">
                    <span className="absolute h-[69.8%] w-[69.8%] rounded-full bg-primary" />
                    <Icon className="relative h-[36%] w-[36%] text-white" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-3 md:gap-5 lg:gap-[1.125rem]">
                    <h3 className="font-heading text-[1.375rem] font-medium leading-[1.2] tracking-normal text-ink md:text-[1.9375rem] lg:text-[1.75rem]">
                      {card.title}
                    </h3>
                    <p className="text-[1.0625rem] font-extralight leading-[1.5] text-ink-muted md:text-[1.5625rem] lg:text-[1.4125rem]">
                      {card.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
