"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";

import { footerCompanyLinks, footerServiceLinks } from "@/features/marketing/data";
import { BRAND_NAME, BRAND_SUPPORT_EMAIL } from "@/lib/brand";

// Values follow the Figma frames: `md:` = "Home - Tablet" (Frame 160), `lg:` = "Home" desktop (Frame 79),
// except desktop font sizes, which were reduced from Figma on request.
// There is no mobile footer in Figma, so the base styles are a scaled-down tablet layout.

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/caretekk-health-technologies-ltd/", icon: "linkedin", w: 36, h: 34 },
  { label: "Facebook", href: "https://www.facebook.com/share/1BSrQHdC8m/", icon: "facebook", w: 17, h: 29 },
  { label: "Email", href: `mailto:${BRAND_SUPPORT_EMAIL}`, icon: "email", w: 31, h: 22 },
];

const formShadow =
  "shadow-[0_9px_20px_rgba(158,154,154,0.10),0_36px_36px_rgba(158,154,154,0.09),0_81px_48px_rgba(158,154,154,0.05),0_144px_57px_rgba(158,154,154,0.01)]";

export function SiteFooter() {
  return (
    <footer
      id="contact"
      className="relative overflow-hidden rounded-[30px] bg-gradient-to-b from-[#2563eb] to-[#60a5fa] text-white lg:mx-[10px] lg:mb-[9px]"
    >
      {/* Figma: 20% pattern fill (4px dots every 24px) plus a 21%-opacity perspective grid. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.2) 2px, transparent 2.5px)",
          backgroundSize: "24px 24px",
          backgroundPosition: "-10px -10px",
        }}
      />
      <Image
        src="/img/footer/grid.svg"
        unoptimized
        alt=""
        aria-hidden="true"
        width={4638}
        height={1460}
        className="pointer-events-none absolute -left-[1670px] -top-[350px] w-[4638px] max-w-none"
      />

      <div className="relative px-5 pb-12 pt-14 md:pb-[71px] md:px-[57px] md:pt-[92px] lg:pb-[90px] lg:pt-[148px]">
        {/* Newsletter */}
        {/* Side by side only when the full desktop row (613 + 112 + 672px) roughly fits; otherwise stacked like the tablet frame. */}
        <div className="flex flex-col gap-10 md:gap-[112px] xl:flex-row xl:items-center xl:justify-between xl:gap-8">
          <div className="max-w-[613px] xl:min-w-0 xl:flex-1">
            <h2 className="text-3xl font-bold leading-[1.2] md:text-[49px] lg:text-[38px]">Subscribe To Our Newsletter.</h2>
            <p className="mt-4 text-base leading-[1.5] md:mt-5 md:text-[23px] lg:text-lg">
              {`Health tips, new services, and updates from ${BRAND_NAME} straight to your inbox. No spam, just what's useful for your family.`}
            </p>
          </div>
          <NewsletterForm />
        </div>

        {/* Brand + links */}
        <div className="mt-14 md:mt-[141px] md:pl-[18px] lg:mt-[166px] lg:grid lg:grid-cols-[minmax(0,452px)_208px_255px] lg:items-start lg:gap-x-[clamp(32px,6vw,90px)]">
          <div className="md:max-w-[541px] lg:max-w-none">
            <Link
              href="/"
              aria-label={`${BRAND_NAME} home`}
              className="inline-flex h-[50px] items-center gap-1 rounded-[10px] bg-white pr-3 md:h-[63px] md:w-[241px] md:gap-[5px] md:pr-0"
            >
              <Image src="/img/footer/logo-mark.png" alt="" width={63} height={44} className="h-[35px] w-auto md:h-[44px]" />
              <Image src="/img/footer/logo-name.png" alt={BRAND_NAME} width={173} height={44} className="h-[35px] w-auto md:h-[44px]" />
            </Link>
            <p className="mt-6 text-lg font-light leading-[1.5] md:mt-[30px] md:text-[27px] lg:text-xl">
              Trusted digital healthcare for doctor consultations, homecare support, records, and follow-up care.
            </p>
            <div className="mt-8 flex gap-3 md:mt-[47px] md:gap-[14px]">
              {socialLinks.map(({ label, href, icon, w, h }) => {
                const circle =
                  "flex h-14 w-14 items-center justify-center rounded-full border border-[#1e40af] bg-[#eff6ff] md:h-[75px] md:w-[75px]";
                const glyph = (
                  // Each icon keeps its own Figma size; phones use 75% of it.
                  <Image
                    src={`/img/footer/${icon}.svg`}
                    alt=""
                    width={w}
                    height={h}
                    unoptimized
                    style={{ "--w": `${w}px` } as CSSProperties}
                    className="h-auto w-[calc(var(--w)*0.75)] md:w-(--w)"
                  />
                );
                const external = href.startsWith("http");
                return (
                  <a
                    key={label}
                    href={href}
                    aria-label={label === "Email" ? "Email support" : `${BRAND_NAME} on ${label}`}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className={`${circle} transition hover:bg-white`}
                  >
                    {glyph}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="mt-14 flex gap-12 md:mt-[116px] md:gap-[91px] lg:contents">
            <FooterColumn title="Company" links={footerCompanyLinks} className="md:w-[208px]" />
            <FooterColumn title="Services" links={footerServiceLinks} className="md:w-[255px]" />
          </div>
        </div>

        {/* Wordmark (exported from Figma) */}
        <Image
          src="/img/footer/wordmark.svg"
          unoptimized
          alt=""
          aria-hidden="true"
          width={956}
          height={165}
          className="mx-auto mt-14 h-auto w-full max-w-[956px] md:mt-[116px] md:h-[131px] md:w-auto lg:mt-[122px] lg:h-[165px]"
        />
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
  className = "",
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
  className?: string;
}) {
  return (
    <div className={`lg:mt-[18px] ${className}`}>
      <h3 className="text-xl font-semibold leading-[1.5] md:text-[27px] lg:text-[22px]">{title}</h3>
      <ul className="mt-5 space-y-4 md:mt-[30px] md:space-y-[26px]">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-base font-light leading-[1.5] transition hover:underline md:text-[24px] lg:text-lg">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// globals.css sets `input, button { font: inherit }` outside any layer, which beats Tailwind utilities,
// so the input needs `!` on its font classes and the button text lives in a <span>.
// Tablet and desktop form are intentionally ~70% of the Figma size (402x90 / 249x90), on request.
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: send `email` to the newsletter endpoint once the backend exposes one.
    setSubmitted(true);
    setEmail("");
  }

  if (submitted) {
    return (
      <p role="status" className="rounded-[20px] bg-white/15 px-6 py-4 text-base md:text-[21px]">
        Thanks! You&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full shrink-0 gap-2.5 md:w-auto md:gap-4">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Enter your email address"
        className={`h-12 min-w-0 flex-[402] rounded-[14px] bg-[#eff6ff] px-4 text-sm! font-extralight! leading-[1.2]! text-black outline-none placeholder:text-black focus:ring-2 focus:ring-white/70 md:h-16 md:w-[320px] md:flex-none md:rounded-2xl md:px-7 md:text-lg! ${formShadow}`}
      />
      <button
        type="submit"
        className={`inline-flex h-12 min-w-0 flex-[249] items-center justify-center gap-2.5 rounded-[50px] bg-[#1e40af] px-4 transition hover:bg-[#1a368f] md:h-16 md:w-[200px] md:flex-none md:gap-3.5 md:px-2.5 ${formShadow}`}
      >
        <span className="text-sm font-normal leading-[1.2] md:text-lg">Subscribe</span>
        {/* Vuesax arrow exported from Figma */}
        <svg viewBox="0 0 32 24" fill="none" aria-hidden="true" className="h-3.5 w-[18px] shrink-0 md:h-[18px] md:w-6">
          <path d="M20.136 1.53193L30.468 11.864L20.136 22.196" stroke="white" strokeWidth={3.06} strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1.53193 11.8635H30.179" stroke="white" strokeWidth={3.06} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
