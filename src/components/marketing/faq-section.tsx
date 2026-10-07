"use client";

import { useState } from "react";
import Image from "next/image";

import { faqItems } from "@/features/marketing/data";

// Sizes follow the Figma frames: `md:` = "Home - Tablet" (834px), `lg:` = "Home" desktop (1512px),
// except desktop font sizes, which were reduced from Figma on request.
// There is no mobile FAQ in Figma, so the base styles are a scaled-down tablet layout.
export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(3);

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-[#fcfdff] px-4 pb-24 pt-20 md:px-3 md:pb-[115px] md:pt-[120px] lg:px-10 lg:pb-[220px] lg:pt-[161px]"
    >
      <div className="text-center">
        <p className="text-lg font-light uppercase text-[#1e40af] sm:text-2xl md:text-[32px] md:leading-[48px] lg:text-2xl lg:leading-9">faqs</p>
        {/* Figma uses 0 letter-spacing, so no `font-heading` (it tightens tracking). Line breaks match each frame. */}
        <h2 className="mx-auto mt-2 text-3xl font-bold leading-[1.2] text-[#0b1c30] sm:text-5xl md:mt-3.5 md:text-[61px] lg:text-5xl">
          Need To Know More
          <br className="hidden md:inline lg:hidden" /> On
          <br className="hidden lg:inline" /> Our <span className="text-[#3b82f6]">Platform?</span>
        </h2>
      </div>

      <div className="relative mx-auto mt-10 max-w-[986px] md:mt-[94px] md:max-w-[811px] lg:mt-[103px] lg:max-w-[986px]">
        {/* Sits behind the list, pinned to the left edge of the screen; it shows through the gaps between items. */}
        <Image
          src="/img/faq-illustration.png"
          alt=""
          aria-hidden="true"
          width={594}
          height={576}
          loading="eager"
          className="pointer-events-none absolute left-[calc(50%-50vw)] top-[130px] w-[300px] max-w-none md:top-[187px] md:w-[435px] lg:top-[267px] lg:w-[594px]"
        />

        <div className="relative space-y-4 sm:space-y-6 md:space-y-[29px] lg:space-y-[35px]">
          {faqItems.map((item, i) => {
            const open = openIndex === i;
            const panelId = `faq-panel-${i}`;

            return (
              <div
                key={item.question}
                className={`rounded-[28px] md:rounded-[41px] lg:rounded-[50px] ${open ? "bg-[#eff6ff]" : "bg-[#dbeafe]"}`}
              >
                <button
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(open ? null : i)}
                  className={`flex w-full justify-between gap-4 text-left ${
                    open
                      ? "items-start pl-6 pr-5 pt-8 sm:pl-10 md:pl-[62px] md:pr-[63px] md:pt-[54px] lg:pl-[75px] lg:pr-[78px] lg:pt-[66px]"
                      : "items-center py-4 pl-5 pr-5 sm:pl-8 md:min-h-[91px] md:pl-[38px] md:pr-[55px] lg:min-h-[111px] lg:py-5 lg:pl-[46px] lg:pr-[67px]"
                  }`}
                >
                  <span
                    className={`text-[15px] leading-[1.2] text-[#0b1c30] sm:text-xl md:text-[23px] lg:text-[22px] ${
                      open ? "font-medium" : "font-normal"
                    }`}
                  >
                    {item.question}
                  </span>
                  <FaqArrow open={open} />
                </button>

                <div
                  id={panelId}
                  hidden={!open}
                  className="mt-5 space-y-[1.56em] pb-8 pl-6 pr-6 text-sm font-light leading-[1.56] text-[#0b1c30] sm:pl-10 sm:pr-10 sm:text-lg md:mt-8 md:max-w-[736px] md:pb-[60px] md:pl-[62px] md:pr-0 md:text-[22px] lg:mt-[39px] lg:max-w-[895px] lg:pb-[76px] lg:pl-[75px] lg:text-xl"
                >
                  {item.answer.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Vuesax "arrow-right" exported from the Figma file, in its closed and open rotations.
function FaqArrow({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 71 71"
      fill="none"
      stroke="#1E40AF"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`-my-2 h-10 w-10 shrink-0 sm:h-12 sm:w-12 md:my-0 md:h-[58px] md:w-[58px] lg:h-[71px] lg:w-[71px] ${
        open ? "md:-mt-9 lg:-mt-[45px]" : ""
      }`}
    >
      {open ? (
        <>
          <path d="M42.4333 47.4087L24.4763 49.6213L22.2638 31.6643" />
          <path d="M46.524 21.3777L24.697 49.3393" />
        </>
      ) : (
        <>
          <path d="M30.1804 22.8992L48.1374 22.9915L48.0452 40.9485" />
          <path d="M22.8624 48.0076L47.8846 23.2412" />
        </>
      )}
    </svg>
  );
}
