import { serviceOffers } from "@/features/marketing/data";
import { cn } from "@/lib/utils";
import { PingBadge } from "./ping-badge";
import { ArrowLongRightIcon } from "./marketing-icons";
import Image from "next/image";
import Link from "next/link";


export function ServiceCard({
    offer,
    pingDelay = 0,
    className,
}: {
    offer: (typeof serviceOffers)[number];
    pingDelay?: number;
    className?: string;
}) {
    const { title, text, cta, href, image, alt, icon: Icon } = offer;

    return (
        <article
            className={cn(
                "flex flex-col overflow-hidden rounded-[22px] bg-white pb-[64px] shadow-[0_24px_48px_-24px_rgba(8,20,80,0.45)] lg:min-h-[575px] max-sm:pb-10",
                className,
            )}
        >
            <div className="relative h-[247px] shrink-0">
                <svg
                    aria-hidden="true"
                    viewBox="0 0 174 247"
                    preserveAspectRatio="none"
                    fill="none"
                    stroke="#C3CEF3"
                    className="absolute left-0 top-0 h-full w-[38%]"
                >
                    <path d="M0 34H174M0 155H174M82 0 8 155" vectorEffect="non-scaling-stroke" />
                </svg>
                <div className="absolute inset-y-0 right-0 w-[62%]">
                    <Image src={image} alt={alt} fill sizes="(min-width: 1024px) 29vw, 60vw" className="object-cover" />
                </div>
                <PingBadge
                    delay={pingDelay}
                    className="absolute bottom-0 left-[47px] h-[90px] w-[90px] translate-y-1/2 max-sm:left-[28px]"
                >
                    <Icon className="relative h-full w-full" />
                </PingBadge>
            </div>

            <div className="px-[47px] pt-[83px] max-sm:px-[28px]">
                <h3 className="max-w-[250px] text-[25px] font-semibold leading-[32px] text-[#0B1C30]">{title}</h3>
                <p className="mt-[16px] max-w-[360px] text-[15.5px] leading-[25.5px] text-[#434655]">{text}</p>
                <Link
                    href={href}
                    className="group mt-[21px] inline-flex items-center gap-[14px] rounded-md text-[16px] font-medium text-[#1E40AF] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563EB]/20"
                >
                    {cta}
                    <ArrowLongRightIcon className="h-[14px] w-[20px] transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
            </div>
        </article>
    );
}