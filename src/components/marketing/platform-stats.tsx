import { platformStats } from "@/features/marketing/data";

export function PlatformStats() {
  return (
    <dl className="mx-auto grid w-[900px] max-w-full grid-cols-2 lg:grid-cols-4">
      {platformStats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col-reverse items-center justify-end border-primary-600/90 px-2 py-[20px] text-center max-lg:even:border-l lg:border-l lg:first:border-l-0"
        >
          <dt className="mt-[12px] text-[15.5px] leading-tight text-grey-600 max-sm:text-[14px]">{stat.label}</dt>
          <dd className="text-[30px] font-bold leading-none text-info-500 max-sm:text-[24px]">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
