import Image from "next/image";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { BRAND_NAME } from "@/lib/brand";

import { AUTH_PANEL_PHOTO } from "./auth-photo-panel";

export function AuthHeroPanel() {
  return (
    <aside className="relative hidden overflow-hidden rounded-lg bg-black-800 lg:sticky lg:top-3 lg:flex lg:h-[calc(100dvh-1.5rem)] lg:min-h-[560px] lg:flex-col lg:justify-between lg:self-start lg:p-12 xl:pb-[68px] xl:pl-[88px] xl:pr-12 xl:pt-[60px]">
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src={AUTH_PANEL_PHOTO}
          alt=""
          fill
          sizes="(min-width: 1024px) 50vw, 1px"
          loading="eager"
          className="object-cover object-[50%_20%]"
        />
      </div>
      <div aria-hidden="true" className="absolute inset-0 bg-black-900/40" />
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black-900/85 to-transparent" />

      <div className="relative z-10">
        <BrandLockup
          href="/"
          gapClassName="gap-2"
          iconSizeClassName="h-8 w-8 brightness-0 invert"
          wordmarkSizeClassName="h-6 max-w-[148px]"
          wordmarkClassName="brightness-0 invert"
        />
      </div>

      <div className="relative z-10 max-w-[579px] text-white">
        <p className="type-heading-4 xl:type-heading-3">A Better place to get care that puts your family first</p>
        <p className="type-body-giant mt-4 text-white">With {BRAND_NAME} you can find care solutions</p>
      </div>
    </aside>
  );
}
