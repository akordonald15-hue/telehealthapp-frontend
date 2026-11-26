import Image from "next/image";

import { BrandLockup } from "@/components/brand/brand-lockup";

type AuthVisualPanelProps = {
  headline: string;
  subline: string;
};

const PANEL_IMAGE = "/img/Dr michael Idam.jpg";

// Static signup visual: one approved doctor portrait, no carousel or motion.
export function AuthVisualPanel({ headline, subline }: AuthVisualPanelProps) {
  return (
    <section className="relative isolate hidden overflow-hidden rounded-lg bg-black-900 shadow-600 lg:block">
      <Image
        src={PANEL_IMAGE}
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 744px, 0px"
        className="object-cover object-[center_40%]"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-black-900/50" />

      <div className="absolute left-10 top-10 xl:left-[88px] xl:top-[50px]">
        <BrandLockup inverse wordmarkClassName="h-8 max-w-[185px]" />
      </div>

      <div className="absolute bottom-10 left-10 right-10 xl:bottom-[69px] xl:left-[88px] xl:right-[77px]">
        <h2 className="type-heading-3 text-white">{headline}</h2>
        <p className="mt-[18px] type-body-giant text-white">{subline}</p>
      </div>
    </section>
  );
}
