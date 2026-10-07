import { platformHighlights } from "@/features/marketing/data";
import { PingBadge } from "./ping-badge";
import { cn } from "@/lib/utils";


export function SolutionCard({
    highlight,
    tall = false,
    pingDelay = 0,
    className,
}: {
    highlight: (typeof platformHighlights)[number];
    tall?: boolean;
    pingDelay?: number;
    className?: string;
}) {
    const { title, text, icon: Icon, tone } = highlight;
    const dark = tone === "dark";

    return (
        <article
            className={cn(
                "flex flex-col rounded-[28px] px-[40px] max-lg:justify-end max-lg:pb-[56px] max-lg:pt-[48px] max-sm:px-[28px]",
                tall ? "justify-end pb-[56px] pt-[48px] md:min-h-[426px]" : "pb-[44px] pt-[42px]",
                dark
                    ? "bg-[#1E3A8A] bg-[radial-gradient(rgb(255_255_255/0.09)_1px,transparent_1.4px)] bg-[size:16px_16px] shadow-[0_28px_60px_-30px_rgba(30,58,138,0.6)]"
                    : "bg-white shadow-[0_22px_48px_-28px_rgba(48,48,134,0.2)]",
                className,
            )}
        >
            <PingBadge dark={dark} delay={pingDelay} className="relative h-[92px] w-[92px]">
                <Icon className="relative h-full w-full" />
            </PingBadge>
            <h3 className={cn("mt-[28px] text-[21px] font-bold leading-[1.25]", dark ? "text-white" : "text-[#0B1C30]")}>{title}</h3>
            <p className={cn("mt-[12px] max-w-[372px] text-[15px] leading-[24px]", dark ? "text-white/85" : "text-[#434655]")}>{text}</p>
        </article>
    );
}